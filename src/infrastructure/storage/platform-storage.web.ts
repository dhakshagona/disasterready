import type { KeyValueStorage } from '@/infrastructure/storage/storage-port';
import { BrowserKeyValueStorage } from '@/infrastructure/storage/web-storage';

function browserStorage(): BrowserKeyValueStorage {
  if (!globalThis.localStorage) throw new Error('Browser storage is unavailable');
  return new BrowserKeyValueStorage(globalThis.localStorage);
}

export const platformStorage: KeyValueStorage = {
  getItem: (key) => browserStorage().getItem(key),
  setItem: (key, value) => browserStorage().setItem(key, value),
  removeItem: (key) => browserStorage().removeItem(key),
};
