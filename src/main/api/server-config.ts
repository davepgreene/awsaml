import path from 'node:path'
import express, { Application, Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import session from 'express-session'

export interface ServerConfig {
  server: {
    host: string
    port: number
  }
}

interface AuthStrategy {
  initialize(): express.RequestHandler
  session(): express.RequestHandler
}

const app = express()

export default (auth: AuthStrategy, config: ServerConfig, secret: string): Application => {
  app.set('host', config.server.host)
  app.set('port', config.server.port)
  app.set('baseUrl', `http://${config.server.host}:${config.server.port}/`)
  app.set('configureUrlRoute', 'configure')
  app.set('refreshUrlRoute', 'refresh')

  app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :res[content-length]'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(session({
    resave: false,
    saveUninitialized: true,
    secret,
  }))
  app.use(auth.initialize())
  app.use(auth.session())
  app.use(express.static(path.join(__dirname, '..', 'build')))

  if (process.env.NODE_ENV === 'development') {
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE')
      next()
    })
  }

  return app
}
