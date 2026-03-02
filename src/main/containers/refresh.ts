import { STSClient, AssumeRoleWithSAMLCommand } from '@aws-sdk/client-sts'
import { WebContents } from 'electron'
import config from '../api/config.json'
import AwsCredentials from '../api/aws-credentials'
import ResponseObj from '../api/response'
import Reloader from '../api/reloader/reloader'
import { app } from '../api/server'
import { AuthConfig, Config, Session, StoredMetadata } from '../types'

const credentials = new AwsCredentials()

async function refreshCallback(profileName: string, session: Session, wc: WebContents) {
  const refreshResponseObj = {
    ...ResponseObj,
    accountId: session.accountId,
    roleName: session.roleName,
    showRole: session.showRole,
  }

  const region = session.roleArn!.includes('aws-us-gov') ? 'us-gov-west-1' : 'us-east-1'
  const client = new STSClient({ region })

  const input = {
    DurationSeconds: (config as Config).aws.duration,
    PrincipalArn: session.principalArn,
    RoleArn: session.roleArn,
    SAMLAssertion: session.samlResponse,
  }

  let data
  const command = new AssumeRoleWithSAMLCommand(input)
  try {
    data = await client.send(command)
  } catch (e) {
    console.error(e)
    return {
      redirect: (config.auth as AuthConfig).entryPoint,
      logout: true,
    }
  }

  const credentialResponseObj = {
    ...refreshResponseObj,
    accessKey: data.Credentials!.AccessKeyId,
    secretKey: data.Credentials!.SecretAccessKey,
    sessionToken: data.Credentials!.SessionToken,
    expiration: data.Credentials!.Expiration,
    profileName: undefined as string | undefined,
  }

  const metadataUrl = app.get('metadataUrl')

  // Update the stored profile with account number(s) and profile names
  const metadataUrls = (globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []).map((metadata: StoredMetadata): StoredMetadata => {
    const ret: StoredMetadata = {
      ...metadata,
    }

    if (metadata.url === metadataUrl) {
      // If the stored metadataUrl label value is the same as the URL
      // default to the profile name!
      if (metadata.name === metadataUrl) {
        ret.name = profileName
      }
      ret.roles = session.roles?.map((role) => role.roleArn)
    }

    return ret
  })

  globalThis.Store.set('metadataUrls', metadataUrls)

  // Fetch the metadata profile name for this URL
  const profile = metadataUrls.find((metadata: StoredMetadata) => metadata.url === metadataUrl)
  credentialResponseObj.profileName = profile?.name

  try {
    credentials.save(data.Credentials!, profileName, region)
  } catch (e) {
    return {
      ...credentialResponseObj,
      error: e,
    }
  }

  wc.send('reloadUi', credentialResponseObj)
  return credentialResponseObj
}

async function refresh() {
  const session = globalThis.Store.get<Session>('session')
  const { webContents } = await import('electron')
  const wc = webContents.getFocusedWebContents()

  if (session === undefined) {
    return {
      error: 'Invalid session',
      logout: true,
    }
  }
  const profileName = `awsaml-${session.accountId}`

  let r = globalThis.Manager.get(profileName)
  if (!r) {
    r = new Reloader({
      name: profileName,
      async callback() {
        await refreshCallback(profileName, session, wc!)
      },
      interval: (config.aws.duration / 2) * 1000,
    })
    globalThis.Manager.add(r)
    r.start()
  } else {
    r.restart()
  }
  return refreshCallback(profileName, session, wc!)
}

export {
  refresh,
}
