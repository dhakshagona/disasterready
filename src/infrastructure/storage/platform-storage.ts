import Storage from 'expo-sqlite/kv-store';

import type { KeyValueStorage } from '@/infrastructure/storage/storage-port';

export const platformStorage: KeyValueStorage = {
  getItem: (key) => Storage.getItem(key),
  setItem: async (key, value) => { await Storage.setItem(key, value); },
  removeItem: async (key) => { await Storage.removeItem(key); },
};
