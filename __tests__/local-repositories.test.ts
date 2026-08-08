import { LocalAlertCache, LocalChecklistProgressRepository, LocalNotificationReceiptRepository, LocalPreferencesRepository, LocalShelterCache } from '@/infrastructure/storage/local-repositories';
import type { KeyValueStorage } from '@/infrastructure/storage/storage-port';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';
import type { UserPreferences } from '@/domain/models';
import { describe, expect, it } from '@jest/globals';

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('local-first repositories', () => {
  it('stores alert caches separately by saved location', async () => {
    const storage = new MemoryStorage();
    const cache = new LocalAlertCache(storage);
    const entry = { alerts: [demoFloodAlert], retrievedAt: '2026-08-07T20:05:00.000Z' };

    await cache.set('austin', entry);

    await expect(cache.get('austin')).resolves.toEqual(entry);
    await expect(cache.get('houston')).resolves.toBeNull();
  });

  it('persists checklist progress by action-plan id', async () => {
    const repository = new LocalChecklistProgressRepository(new MemoryStorage());

    await repository.setCompleted('plan-1', new Set(['step-1', 'step-2']));

    await expect(repository.getCompleted('plan-1')).resolves.toEqual(new Set(['step-1', 'step-2']));
    await expect(repository.getCompleted('plan-2')).resolves.toEqual(new Set());
  });

  it('stores verified shelter results by saved location', async () => {
    const cache = new LocalShelterCache(new MemoryStorage());
    const entry = {
      shelters: [{
        id: 'fema-1',
        name: 'Verified Shelter',
        status: 'open' as const,
        address: '100 Main St, Austin, TX 78701',
        latitude: 30.27,
        longitude: -97.74,
        lastUpdatedAt: '2026-08-08T00:00:00.000Z',
        source: 'FEMA ESF #6 Shelter System',
        sourceUrl: 'https://gis.fema.gov/example',
        isVerified: true,
      }],
      retrievedAt: '2026-08-08T00:00:00.000Z',
      radiusMiles: 100,
    };

    await cache.set('austin', entry);

    await expect(cache.get('austin')).resolves.toEqual(entry);
    await expect(cache.get('houston')).resolves.toBeNull();
  });

  it('persists guest preferences including coordinates', async () => {
    const repository = new LocalPreferencesRepository(new MemoryStorage());
    const updated: UserPreferences = { ...defaultPreferences, hazards: ['tornado'] };

    await repository.save(updated);

    await expect(repository.get()).resolves.toEqual(updated);
  });

  it('records notification fingerprints once in a bounded local receipt set', async () => {
    const repository = new LocalNotificationReceiptRepository(new MemoryStorage(), 2);

    await repository.record('provider-1:sent-1');
    await repository.record('provider-2:sent-2');
    await repository.record('provider-3:sent-3');

    await expect(repository.has('provider-1:sent-1')).resolves.toBe(false);
    await expect(repository.has('provider-2:sent-2')).resolves.toBe(true);
    await expect(repository.has('provider-3:sent-3')).resolves.toBe(true);
  });

  it('fails closed when stored JSON is malformed', async () => {
    const storage = new MemoryStorage();
    storage.values.set('alerts:austin', '{invalid-json');

    await expect(new LocalAlertCache(storage).get('austin')).resolves.toBeNull();
  });

  it('rejects structurally invalid cached alerts', async () => {
    const storage = new MemoryStorage();
    storage.values.set('alerts:austin', JSON.stringify({ alerts: [{ id: 'incomplete' }], retrievedAt: '2026-08-07T20:05:00.000Z' }));

    await expect(new LocalAlertCache(storage).get('austin')).resolves.toBeNull();
  });

  it('rejects preference records with unsupported hazards or invalid coordinates', async () => {
    const storage = new MemoryStorage();
    storage.values.set('preferences:guest', JSON.stringify({
      ...defaultPreferences,
      hazards: ['flood', 'not-a-real-hazard'],
      location: { ...defaultPreferences.location, latitude: 200 },
    }));

    await expect(new LocalPreferencesRepository(storage).get()).resolves.toBeNull();
  });
});
