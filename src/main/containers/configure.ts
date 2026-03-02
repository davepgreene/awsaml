import https from 'node:https'
import { v4 as uuidv4 } from 'uuid'
import { DOMParser } from '@xmldom/xmldom'
import xpath from 'xpath.js'
import { app, auth } from '../api/server'
import ResponseObj from '../api/response'
import config from '../api/config.json'
import { PassportSamlConfig } from '@node-saml/passport-saml'
import { IpcMainInvokeEvent } from 'electron'
import { StoredMetadata, Metadata, AuthConfig, LoginPayload } from './../types'

const Errors = {
  invalidMetadataErr: 'The SAML metadata is invalid.',
  urlInvalidErr: 'The SAML metadata URL is invalid.',
  uuidInvalidError: 'The profile is invalid.',
}

async function getMetadataUrls() {
  let migrated = false
  let storedMetadataUrls: StoredMetadata[]

  storedMetadataUrls = (globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []).map((metadata) => {
    const ret = {
      ...metadata,
    }
    if (metadata.profileUuid === undefined) {
      migrated = true
      ret.profileUuid = uuidv4()
    }

    return ret
  })

  if (migrated) {
    globalThis.Store.set('metadataUrls', storedMetadataUrls)
  }

  return storedMetadataUrls
}

async function setMetadataUrls(_event: IpcMainInvokeEvent, metadataUrls: Metadata[]) {
  globalThis.Store.set('metadataUrls', metadataUrls)
}

async function getDefaultMetadata() {
  const storedMetadataUrls = (globalThis.Store.get<StoredMetadata[]>('metadataUrls') || [])

  let defaultMetadataName = app.get('profileName') || ''

  // We populate the value of the metadata url field on the following (in order of precedence):
  //   1. Use the current session's metadata url (may have been rejected).
  //   2. Use the latest validated metadata url.
  //   3. Support the <= v1.3.0 storage key.
  //   4. Default the metadata url to empty string.
  let defaultMetadataUrl = app.get('metadataUrl')
      || globalThis.Store.get<string>('previousMetadataUrl')
      || globalThis.Store.get<string>('metadataUrl')
      || ''

  if (!defaultMetadataUrl) {
    if (storedMetadataUrls.length > 0) {
      const defaultMetadata = storedMetadataUrls[0]
      if (Object.prototype.hasOwnProperty.call(defaultMetadata, 'url')) {
        defaultMetadataUrl = defaultMetadata.url
      }
      if (Object.prototype.hasOwnProperty.call(defaultMetadata, 'name')) {
        defaultMetadataName = defaultMetadata.name
      }
    }
  }

  return {
    url: defaultMetadataUrl,
    name: defaultMetadataName,
  }
}

async function asyncHttpsGet(urlStr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    https.get(urlStr, (res) => {
      if (res.statusCode !== 200) {
        return reject(res)
      }

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(data)
      })
    })
  })
}

async function deleteProfile(_event: IpcMainInvokeEvent, payload: { profileUuid: string }) {
  const {
    profileUuid,
  } = payload

  let metadataUrls = globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []

  metadataUrls = metadataUrls
    .filter((metadata) => metadata.profileUuid !== profileUuid)
  globalThis.Store.set('metadataUrls', metadataUrls)

  return {}
}

async function getProfile(_event: IpcMainInvokeEvent, payload: { profileUuid: string }) {
  const {
    profileUuid,
  } = payload

  const metadataUrls = globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []
  const profile = metadataUrls.find((el) => el.profileUuid === profileUuid)

  return {
    profile,
  }
}

async function login(_event: IpcMainInvokeEvent, payload: LoginPayload) {
  const {
    profileUuid,
    profileName,
    metadataUrl,
  } = payload

  let storedMetadataUrls = globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []
  let profile

  if (!metadataUrl) {
    globalThis.Store.set('metadataUrlValid', false)
    globalThis.Store.set('metadataUrlError', Errors.urlInvalidErr)

    return {
      ...ResponseObj,
      error: Errors.urlInvalidErr,
      metadataUrlValid: false,
    }
  }

  // If a profileUuid is passed, validate it and update storage
  // with the submitted profile name.
  if (profileUuid) {
    profile = storedMetadataUrls.find((metadata) => metadata.profileUuid === profileUuid)

    if (!profile) {
      return {
        ...ResponseObj,
        error: Errors.uuidInvalidError,
        uuidUrlValid: false,
      }
    }

    if (profile.url !== metadataUrl) {
      return {
        ...ResponseObj,
        error: Errors.urlInvalidErr,
        metadataUrlValid: false,
      }
    }

    if (profileName) {
      storedMetadataUrls = storedMetadataUrls.map((metadata) => {
        const ret = {
          ...metadata,
        }

        if (metadata.profileUuid === profileUuid && metadata.name !== profileName) {
          ret.name = profileName
        }

        return ret
      })
      globalThis.Store.set('metadataUrls', storedMetadataUrls)
    }
  } else {
    profile = storedMetadataUrls.find((metadata) => metadata.url === metadataUrl)
  }

  app.set('metadataUrl', metadataUrl)
  app.set('profileName', profileName)

  const metaDataResponseObj = {
    ...ResponseObj,
    defaultMetadataName: profileName,
    defaultMetadataUrl: metadataUrl,
  }

  let data
  try {
    data = await asyncHttpsGet(metadataUrl)
  } catch (e) {
    console.error(e)
    globalThis.Store.set('metadataUrlValid', false)
    globalThis.Store.set('metadataUrlError', Errors.urlInvalidErr)

    return {
      ...metaDataResponseObj,
      error: Errors.urlInvalidErr,
      metadataUrlValid: false,
    }
  }

  globalThis.Store.set('metadataUrlValid', true)
  globalThis.Store.set('metadataUrlError', null)

  const xmlDoc = new DOMParser().parseFromString(data, 'text/xml')
  const safeXpath = (doc: ReturnType<DOMParser['parseFromString']>, p: string) => {
    try {
      return xpath(doc, p)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  let cert = safeXpath(xmlDoc, '//*[local-name(.)=\'X509Certificate\']/text()')
  let issuer = safeXpath(xmlDoc, '//*[local-name(.)=\'EntityDescriptor\']/@entityID')
  let entryPoint = safeXpath(xmlDoc, '//*[local-name(.)=\'SingleSignOnService\' and'
      + ' @Binding=\'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\']/@Location')

  if (cert) {
    cert = cert.length ? cert[0].data.replace(/\s+/g, '') : null
  }
  ;(config.auth as AuthConfig).idpCert = cert

  if (issuer) {
    issuer = issuer.length ? issuer[0].value : null
  }
  ;(config.auth as AuthConfig).issuer = issuer

  if (entryPoint) {
    entryPoint = entryPoint.length ? entryPoint[0].value : null
  }
  ;(config.auth as AuthConfig).entryPoint = entryPoint
  app.set('lastEntryPointLoad', new Date())

  if (!cert || !issuer || !entryPoint) {
    return {
      ...metaDataResponseObj,
      error: Errors.invalidMetadataErr,
    }
  }

  globalThis.Store.set('previousMetadataUrl', metadataUrl)

  // Add a profile for this URL if one does not already exist
  if (!profile) {
    const metadataUrls = globalThis.Store.get<StoredMetadata[]>('metadataUrls') || []

    globalThis.Store.set(
      'metadataUrls',
      metadataUrls.concat([
        {
          name: profileName || metadataUrl,
          profileUuid: uuidv4(),
          url: metadataUrl,
        },
      ]),
    )
  }

  app.set('entryPointUrl', (config.auth as AuthConfig).entryPoint)
  auth.configure(config.auth as unknown as PassportSamlConfig)
  return {
    redirect: (config.auth as AuthConfig).entryPoint,
  }
}

async function isAuthenticated() {
  return globalThis.Store.get('authenticated') || false
}

async function hasMultipleRoles() {
  return globalThis.Store.get('multipleRoles') || false
}

export {
  getMetadataUrls,
  setMetadataUrls,
  getDefaultMetadata,
  login,
  deleteProfile,
  getProfile,
  isAuthenticated,
  hasMultipleRoles,
}
