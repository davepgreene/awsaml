import config from './config.json'
import Auth, { PartialAuthOptions } from './auth'
import serverConfig, { ServerConfig } from './server-config'
import authRoute from './routes/auth'

const sessionSecret = process.env.SESSION_SECRET

const auth = new Auth(config.auth as PartialAuthOptions)
const app = serverConfig(auth, config as ServerConfig, sessionSecret || '')
const authRouteHandler = authRoute(app, auth)

app.use(config.auth.path, authRouteHandler)
app.all('*splat', auth.guard)

export {
  app,
  auth,
}
