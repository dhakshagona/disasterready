import { BrowserKeyValueStorage, type BrowserStorageLike } from '@/infrastructure/storage/web-storage';
import { describe, expect, it } from '@jest/globals';

describe('web storage adapter', () => {
  it('adapts browser localStorage to the shared async storage port', async () => {
    const values = new Map<string, string>();
    const localStorage: BrowserStorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: (key) => { values.delete(key); },
    };
    const storage = new BrowserKeyValueStorage(localStorage);

    await storage.setItem('status', 'ready');
    await expect(storage.getItem('status')).resolves.toBe('ready');
    await storage.removeItem('status');
    await expect(storage.getItem('status')).resolves.toBeNull();
  });
});
