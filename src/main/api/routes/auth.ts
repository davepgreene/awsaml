import { Router, Application } from 'express'
import { authHandler } from '../../containers/auth'
import Auth from '../auth'

const router = Router()

export default (app: Application, auth: Auth) => {
  router.post('/', auth.authenticate('saml', {
    failureFlash: true,
    failureRedirect: app.get('configureUrl'),
  }), authHandler(app))

  return router
}
