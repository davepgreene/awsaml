import Reloader from './../api/reloader/reloader'

interface StorageInstance {
  get<T>(key: string): T | undefined
  set(key: string, value: unknown): void
  delete(key: string): void
}

interface ReloadManager {
  get(name: string): Reloader | undefined
  add(reloader: Reloader): void
  removeByName(name: string): void
  removeByReloader(reloader: Reloader): void
  reloaders: Record<string, Reloader>
}

declare global {
  var Store: StorageInstance
  var Manager: ReloadManager
}

export {}
