import { app } from '../api/server'
import { Session } from '../types'

async function logout() {
  const session = globalThis.Store.get<Session>('session')
  if (!session) return { error: 'No session' }
  
  const profileName = `awsaml-${session.accountId}`
  const reloader = globalThis.Manager.get(profileName)
  if (reloader) {
    reloader.stop()
    globalThis.Manager.removeByReloader(reloader)
  }

  globalThis.Store.set('session', {})
  app.set('entryPointUrl', null)
  globalThis.Store.set('authenticated', false)
  globalThis.Store.set('multipleRoles', false)

  return {
    logout: true,
  }
}

export {
  logout,
}
