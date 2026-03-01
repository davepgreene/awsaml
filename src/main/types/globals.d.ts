import type { Storage as StorageClass } from './api/storage';
import type ReloadManager from './api/reloader/manager';

declare global {
  var Storage: StorageClass;
  var Manager: ReloadManager;
}

export {};
