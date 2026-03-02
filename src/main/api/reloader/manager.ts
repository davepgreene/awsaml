import Reloader from './reloader'

class ReloadManager {
  reloaders: Record<string, Reloader> = {}

  get(name: string): Reloader | undefined {
    return this.reloaders[name]
  }

  add(reloader: Reloader) {
    this.reloaders[reloader.name] = reloader
  }

  removeByName(name: string) {
    delete this.reloaders[name]
  }

  removeByReloader(reloader: Reloader) {
    delete this.reloaders[reloader.name]
  }
}

export default (): ReloadManager => new ReloadManager()
