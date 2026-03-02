import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
} from 'electron'
import { LoginPayload, Metadata } from './types'

contextBridge.exposeInMainWorld('electronAPI', {
  getMetadataUrls: () => ipcRenderer.invoke('configure:metadataUrls:get'),
  setMetadataUrls: (args: Metadata[]) => ipcRenderer.invoke('configure:metadataUrls:set', args),
  getDefaultMetadata: () => ipcRenderer.invoke('configure:defaultMetadata:get'),
  login: (args: LoginPayload) => ipcRenderer.invoke('configure:login', args),
  isAuthenticated: () => ipcRenderer.invoke('configure:is-authenticated'),
  hasMultipleRoles: () => ipcRenderer.invoke('configure:has-multiple-roles'),
  logout: () => ipcRenderer.invoke('logout:get'),
  getRoles: () => ipcRenderer.invoke('select-role:get'),
  setRole: (args: { index: number }) => ipcRenderer.invoke('select-role:set', args),
  deleteProfile: (args: { profileUuid: string }) => ipcRenderer.invoke('configure:profile:delete', args),
  getProfile: (args: { profileUuid: string }) => ipcRenderer.invoke('configure:profile:get', args),
  refresh: () => ipcRenderer.invoke('refresh:get'),
  getDarkMode: () => ipcRenderer.invoke('dark-mode:get'),
  darkModeUpdated: (callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.on('dark-mode:updated', callback),
  copy: (args: string) => ipcRenderer.invoke('copy', args),
  reloadUi: (callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.on('reloadUi', callback),
})
