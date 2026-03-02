interface ReloaderConfig {
  name: string
  callback: () => void
  interval: number
  role?: string
}

interface ReloaderResponse {
  [key: string]: unknown
}

class Reloader {
  intervalId: NodeJS.Timeout | null = null;
  name: string;
  callback: () => void;
  interval: number;
  role?: string;
  response?: ReloaderResponse;

  constructor({
    name,
    callback,
    interval,
    role = '',
  }: ReloaderConfig) {
    this.name = name
    this.callback = callback
    this.interval = interval
    this.role = role
  }

  setCallback(callback: () => void) {
    this.callback = callback
  }

  start() {
    this.intervalId = setInterval(this.callback, this.interval)
  }

  stop() {
    clearInterval(this.intervalId!)
  }

  restart() {
    this.stop()
    this.start()
  }

  setResponse(response: ReloaderResponse) {
    this.response = response
  }

  getResponse(): ReloaderResponse | undefined {
    return this.response
  }
}

export default Reloader
