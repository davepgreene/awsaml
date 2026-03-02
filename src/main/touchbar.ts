import {
  TouchBar,
  BrowserWindow,
} from 'electron'
import path from 'node:path'
import { app } from './api/server'
import { StoredMetadata } from './types'

const {
  TouchBarButton,
  TouchBarGroup,
  TouchBarPopover,
  TouchBarSpacer,
} = TouchBar

const baseUrl = process.env.ELECTRON_START_URL || app.get('baseUrl')
const configureUrl = path.join(baseUrl, app.get('configureUrlRoute'))
const refreshUrl = path.join(baseUrl, app.get('refreshUrlRoute'))

const buttonForProfileWithUrl = (browserWindow: BrowserWindow, profile: string, profileUrl: string) => new TouchBarButton({
  backgroundColor: '#3B86CE',
  click: () => {
    browserWindow.loadURL(configureUrl, {
      extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
      postData: [{
        bytes: Buffer.from(`metadataUrl=${profileUrl}&origin=electron`),
        type: 'rawData',
      }],

    })
  },
  label: profile.replace(/^awsaml-/, ''),
})

const loadTouchBar = (browserWindow: BrowserWindow, storedMetadataUrls: StoredMetadata[]) => {
  const refreshButton = new TouchBarButton({
    backgroundColor: '#62ac5b',
    click: () => {
      browserWindow.loadURL(refreshUrl)
    },
    label: '🔄',
  })

  const profileButtons = storedMetadataUrls
    .map((storedMetadataUrl) => (
      buttonForProfileWithUrl(browserWindow, storedMetadataUrl.name, storedMetadataUrl.url)
    ))
  const touchbar = new TouchBar({
    items: [
      refreshButton,
      new TouchBarGroup({
        items: new TouchBar({ items: profileButtons.slice(0, 3) }),
      }),
      new TouchBarSpacer({
        size: 'flexible',
      }),
      new TouchBarPopover({
        items: new TouchBar({ items: profileButtons }),
        label: '👥 More Profiles',
      }),
    ],
  })

  browserWindow.setTouchBar(touchbar)
}

export {
  loadTouchBar,
}
