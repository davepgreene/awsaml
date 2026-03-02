import AwsCredentials from '../api/aws-credentials'
import ResponseObj from '../api/response'
import Reloader from '../api/reloader/reloader'
import { Session } from '../types'
import log from 'electron-log/main'

const credentials = new AwsCredentials()

interface JitCredentials {
  AccessKeyId: string
  SecretAccessKey: string
  SessionToken: string
  Expiration: string
}

async function refreshJitCallback(profileName: string, session: Session) {
  const refreshResponseObj = {
    ...ResponseObj,
    accountId: session.accountId,
    roleName: session.roleName,
    showRole: session.showRole,
    profileName,
  }

  let response

  log.info(`Refreshing JIT credentials for ${session.roleName} in account ${session.accountId}`);

  try {
    response = await fetch(encodeURI(session.apiUri!), {
      method: 'GET',
      headers: session.header,
    })
  } catch (err) {
    console.error(err)
    globalThis.Manager.removeByName(profileName)
    throw new Error(`AWSAML is unable to fetch credentials from ICS. HTTPS request to URI: ${session.apiUri}`, {
      cause: err,
    })
  }

  let creds: Partial<JitCredentials>

  if (response.ok) {
    creds = await response.json()
  } else {
    globalThis.Manager.removeByName(profileName)
    throw new Error('An error occurred while fetching credentials from ICS')
  }

  const credentialResponseObj = {
    ...refreshResponseObj,
    accessKey: creds.AccessKeyId,
    secretKey: creds.SecretAccessKey,
    sessionToken: creds.SessionToken,
    expiration: creds.Expiration,
  }

  log.info(`Saving refreshed JIT credentials for ${session.roleName} in account ${session.accountId}`);

  try {
    credentials.save(creds as JitCredentials, profileName, session.region)
  } catch (e) {
    return {
      ...credentialResponseObj,
      error: e,
    }
  }

  return credentialResponseObj
}

async function refreshJit(session: Session) {
  const profileName = `awsaml-${session.accountId}`
  let r = globalThis.Manager.get(profileName)

  if (!r) {
    r = new Reloader({
      name: profileName,
      async callback() {
        await refreshJitCallback(profileName, session).catch((e: Error) => { throw e })
      },
      interval: (session.duration! / 2) * 1000,
      role: session.roleConfigId!,
    })
    globalThis.Manager.add(r)
    r.start()
  } else {
    if (session.roleConfigId !== r.role) {
      r.role = session.roleConfigId
      r.setCallback(
        async () => {
          await refreshJitCallback(profileName, session).catch((e: Error) => { throw e })
        },
      )
      r.role = session.roleConfigId
    }
    r.restart()
  }
  return refreshJitCallback(profileName, session).catch((e: Error) => { throw e })
}

export {
  refreshJit,
}
