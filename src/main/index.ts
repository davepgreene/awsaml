import path from 'node:path'
import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  clipboard,
  IpcMainInvokeEvent,
} from 'electron'
import log from 'electron-log/main'
import { app as Server } from './api/server'
import { loadTouchBar } from './touchbar'
import * as protocol from './protocol'
import containerIndex from './containers/index'
import Storage from './api/storage'
import createManager from './api/reloader/manager'

log.initialize({ preload: true })

// See https://www.electronforge.io/config/makers/squirrel.windows#handling-startup-events
// for more details.

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) {
  app.quit()
}

// Bootstrap the updater
if (app.isPackaged) {
  import('update-electron-app').then(({ updateElectronApp }) => {
    updateElectronApp()
  })
}

const isPlainObject = (value: unknown) => Object.prototype.toString.call(value) === '[object Object]'
const storagePath = path.join(app.getPath('userData'), 'data.json')
const isDev = process.env.NODE_ENV === 'development'
const WindowWidth = 800
const WindowHeight = 800

let mainWindow: BrowserWindow | null = null
let baseUrl = process.env.ELECTRON_START_URL || Server.get('baseUrl')

globalThis.Store = Storage(storagePath)
globalThis.Manager = createManager()

import { StoredMetadata } from './types'

let storedMetadataUrls: StoredMetadata[]
const rawMetadataUrls = globalThis.Store.get('metadataUrls')

// Migrate from old metadata url storage schema to new one
if (isPlainObject(rawMetadataUrls)) {
  const oldFormat = rawMetadataUrls as Record<string, string>
  storedMetadataUrls = Object.keys(oldFormat).map((k) => ({
    name: oldFormat[k],
    url: k,
  }))
  globalThis.Store.set('metadataUrls', storedMetadataUrls)
} else {
  storedMetadataUrls = (rawMetadataUrls as StoredMetadata[]) || []
}

// Disable cache
app.commandLine.appendSwitch('disable-http-cache')
// No reason for Awsaml to force Macs to use dedicated gfx
app.disableHardwareAcceleration()

app.on('window-all-closed', () => {
  app.quit()
})

interface LastWindowState {
  height: number
  width: number
  x?: number
  y?: number
  version?: number
}

let lastWindowState = globalThis.Store.get<LastWindowState>('lastWindowState')

if (lastWindowState === undefined) {
  lastWindowState = {
    height: WindowHeight,
    width: WindowWidth,
  }
}

protocol.registerSchemas()

app.on('ready', async () => {
  await import('./menu')

  protocol.registerHandlers()

  const host = Server.get('host')
  const port = Server.get('port')

  Server.listen(port, host, () => {
    log.info(`Server listening on ${host}:${port}`)
  })

  globalThis.Store.set('session', {})

  mainWindow = new BrowserWindow({
    height: lastWindowState.height,
    show: false,
    title: 'Rapid7 - Awsaml',
    icon: 'images/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    width: lastWindowState.width,
    x: lastWindowState.x,
    y: lastWindowState.y,
  })

  mainWindow.on('close', () => {
    log.info('[Event] BrowserWindow close')
    const bounds = mainWindow!.getBounds()

    globalThis.Store.set('lastWindowState', {
      height: bounds.height,
      version: 1,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y,
    })

    globalThis.Store.delete('session')
    globalThis.Store.delete('authenticated')
    globalThis.Store.delete('multipleRoles')
  })

  mainWindow.on('closed', () => {
    log.info('[Event] BrowserWindow closed')
    mainWindow = null
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    baseUrl = `awsaml://${path.join(__dirname, '../build/index.html')}`
    log.info(`baseUrl: ${baseUrl}`)
    Server.set('baseUrl', baseUrl)
  }

  mainWindow.on('ready-to-show', () => {
    log.info('[Event] BrowserWindow ready-to-show')
    mainWindow!.show()
  })

  log.info('BrowserWindow.loadURL')
  await mainWindow.loadURL(baseUrl)
  log.info('BrowserWindow.loadURL completed')

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('[Event] BrowserWindow did-finish-load')
    loadTouchBar(mainWindow!, storedMetadataUrls)
  })

  // set up IPC handlers
  const { channels } = containerIndex
  Object.entries(channels).forEach(([namespace, value = {}]) => {
    log.info(`Loading handlers for ${namespace}`)
    Object.entries(value).forEach(([channelName, handler]) => {
      ipcMain.handle(channelName, handler as (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown)
    })
  })

  // set up dark mode handler
  ipcMain.handle('dark-mode:get', () => nativeTheme.shouldUseDarkColors)
  nativeTheme.on('updated', () => {
    mainWindow!.webContents.send('dark-mode:updated', nativeTheme.shouldUseDarkColors)
  })

  // set up clipboard handler
  ipcMain.handle('copy', async (_event: IpcMainInvokeEvent, value: string) => {
    clipboard.writeText(value)
  })
})
