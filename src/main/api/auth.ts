import { Request, Response, NextFunction } from 'express';
import { Strategy as SamlStrategy, PassportSamlConfig, Profile, VerifiedCallback } from '@node-saml/passport-saml'
import passport from 'passport'

interface User {
  nameID: string
  [key: string]: unknown
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      nameID: string
      [key: string]: unknown
    }
  }
}

export interface AuthOptions {
  entryPoint: string
  callbackUrl: string
  audience: string
  identifierFormat: string
  cert: string
}

export type PartialAuthOptions = Pick<AuthOptions, 'callbackUrl' | 'audience'> & { path: string }

class Auth {
  users: Record<string, User> = Object.create(null);

  passport = passport;

  guard: (req: Request, res: Response, next: NextFunction) => void;

  entryPoint?: string;

  constructor(options: AuthOptions | PartialAuthOptions) {
    this.entryPoint = 'entryPoint' in options ? options.entryPoint : undefined

    this.passport.serializeUser((user: User, done: (err: Error | null, id?: string) => void) => {
      this.users[user.nameID] = user
      return done(null, user.nameID)
    })

    this.passport.deserializeUser((id: string, done: (err: Error | null, user?: User) => void) => {
      done(null, this.users[id])
    })

    this.guard = (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        return next()
      }
      return res.json({
        redirect: this.entryPoint,
      })
    }
  }

  initialize() {
    return this.passport.initialize()
  }

  session() {
    return this.passport.session()
  }

  authenticate(type: string, options: Record<string, unknown>) {
    return this.passport.authenticate(type, options)
  }

  configure(options: PassportSamlConfig) {
    const samlCallback = (profile: Profile | null, done: VerifiedCallback) => done(null, profile as User)

    this.passport.use(new SamlStrategy(options, samlCallback, samlCallback))
  }
}

export default Auth
