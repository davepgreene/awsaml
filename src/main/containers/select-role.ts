import { Session } from '../types'
import { IpcMainInvokeEvent } from 'electron'

async function getRoles() {
  const session = globalThis.Store.get<Session>('session')

  if (!session) {
    return {
      error: 'Invalid session',
    }
  }

  return {
    roles: session.roles,
  }
}

async function setRole(_event: IpcMainInvokeEvent, payload: { index: number }) {
  const session = globalThis.Store.get<Session>('session')

  if (!session) {
    return {
      error: 'Invalid session',
    }
  }

  const {
    index,
  } = payload

  if (index === undefined) {
    return {
      error: 'Missing role',
    }
  }

  if (!session.roles) {
    return { error: 'No roles in session' }
  }

  const role = session.roles[index]

  session.showRole = true
  session.roleArn = role.roleArn
  session.roleName = role.roleName
  session.principalArn = role.principalArn
  session.accountId = role.accountId

  globalThis.Store.set('session', session)
  globalThis.Store.set('multipleRoles', false)

  return {
    status: 'selected',
  }
}

export {
  getRoles,
  setRole,
}
