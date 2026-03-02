import {
  protocol,
  session,
} from 'electron'
import * as fs from 'node:fs'
import * as url from 'node:url'
import { extname } from 'node:path'
import { refreshJit } from './containers/refresh-jit'
import Reloader from './api/reloader/reloader'
import log from 'electron-log/main'

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
}

function registerSchemas() {
  protocol.registerSchemesAsPrivileged([{
    scheme: 'jit',
    privileges: { supportFetchAPI: true },
  }])
}

function registerHandlers() {
  protocol.handle('awsaml', (request) => {
    const filePath = url.fileURLToPath(`file://${request.url.slice('awsaml://'.length)}`)
    const ext = extname(filePath)
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    log.info(`Serving file: ${filePath} with MIME type: ${mimeType}`)
    return new Response(fs.readFileSync(filePath), {
      headers: { 'Content-Type': mimeType },
    })
  })

  protocol.handle('jit', async (request) => {
    const { host, pathname } = new URL(request.url)
    if (host === 'get-active-profiles') {
      const activeProfiles = Object.values(globalThis.Manager.reloaders).map((r: Reloader ) => r.role)
      return new Response(JSON.stringify({ activeProfiles }))
    }

    const sessionId = await session.defaultSession.cookies.get({ name: 'session_id', domain: host })
    const body = await request.body?.getReader().read()
    const reqBody = JSON.parse(Buffer.from(body?.value || []).toString())
    const profile = {
      ...reqBody,
      roleName: reqBody.roleArn.split('/')[1],
      header: {
        'X-Auth-Token': sessionId[0].value,
      },
      apiUri: `https://${host}${pathname}`,
      showRole: false,
    }
    log.info(`Received JIT request for ${profile.roleName}`);

    let data
    try {
      data = await refreshJit(profile)
    } catch (err) {
      if (err instanceof Error) {
        const errBody = JSON.stringify({
          error_message: err.message || 'unknown',
        })
        return new Response(errBody, { status: 500 })
      }
    }
    log.info(`Successfully refreshed JIT for ${JSON.stringify(profile)}`);

    const activeProfiles = Object.values(globalThis.Manager.reloaders).map((r: Reloader) => r.role)
    return new Response(JSON.stringify({
      ...data,
      activeProfiles: activeProfiles
    }))
  })
}

export {
  registerHandlers,
  registerSchemas,
}
