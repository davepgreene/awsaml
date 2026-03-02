import url from 'node:url'
import { Role, Session as AppSession } from '../types'
import { Request, Response, Application } from 'express'
import 'express-session'

declare module 'express-session' {
  interface SessionData {
    passport: AppSession
  }
}

export function authHandler(app: Application) {
  return async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).send('Unauthorized')
      return
    }
    let roleAttr = (req.user as Record<string, unknown>)['https://aws.amazon.com/SAML/Attributes/Role'] as string | string[]
    let frontend = app.get('baseUrl')

    frontend = new url.URL(frontend)

    // Convert roleAttr to an array if it isn't already one
    if (!Array.isArray(roleAttr)) {
      roleAttr = [roleAttr]
    }

    const roles = roleAttr.map((arns: string, i: number) => {
      const [roleArn, principalArn] = arns.split(',')
      const roleArnSegments = roleArn.split(':')
      const accountId = roleArnSegments[4]
      const roleName = roleArnSegments[5].replace('role/', '')

      return {
        accountId,
        index: i,
        principalArn,
        roleArn,
        roleName,
      }
    })

    const session = req.session.passport ?? (req.session.passport = {})

    session.samlResponse = req.body.SAMLResponse
    session.roles = roles

    if (roles.length > 1) {
      // If the session has a previous role, see if it matches
      // the latest roles from the current SAML assertion.  If it
      // doesn't match, wipe it from the session.
      if (session.roleArn && session.principalArn) {
        const found = roles
          .find((role: Role) => role.roleArn === session.roleArn && role.principalArn === session.principalArn)

        if (!found) {
          session.showRole = undefined
          session.roleArn = undefined
          session.roleName = undefined
          session.principalArn = undefined
          session.accountId = undefined
        }
      }

      // If the session still has a previous role, proceed directly to auth.
      // Otherwise ask the user to select a role.
      if (session.roleArn && session.principalArn && session.roleName && session.accountId) {
        globalThis.Store.set('authenticated', true)
      } else {
        globalThis.Store.set('multipleRoles', true)
      }
    } else {
      const role = roles[0]

      globalThis.Store.set('authenticated', true)

      session.showRole = false
      session.roleArn = role.roleArn
      session.roleName = role.roleName
      session.principalArn = role.principalArn
      session.accountId = role.accountId
    }

    globalThis.Store.set('session', session)

    res.redirect(frontend)
  }
}
