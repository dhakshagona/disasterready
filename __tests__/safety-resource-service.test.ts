import { describe, expect, it } from '@jest/globals';

import {
  SafetyResourceService,
  type ShelterCache,
  type ShelterCacheEntry,
  type ShelterSource,
} from '@/application/safety-resources/safety-resource-service';
import type { Shelter } from '@/domain/models';

const location = { id: 'austin', latitude: 30.2672, longitude: -97.7431 };

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: 'fema-1',
    name: 'Verified Shelter',
    status: 'open',
    address: '100 Safe St, Austin, TX 78701',
    latitude: 30.3,
    longitude: -97.7,
    lastUpdatedAt: '2026-08-08T00:00:00.000Z',
    source: 'FEMA ESF #6 Shelter System',
    sourceUrl: 'https://gis.fema.gov/example',
    isVerified: true,
    ...overrides,
  };
}

class MemoryShelterCache implements ShelterCache {
  value: ShelterCacheEntry | null = null;

  async get() {
    return this.value;
  }

  async set(_locationId: string, entry: ShelterCacheEntry) {
    this.value = entry;
  }
}

describe('safety resource service', () => {
  it('returns verified live shelters sorted by distance', async () => {
    const source: ShelterSource = {
      getNearby: async () => [
        makeShelter({ id: 'far', latitude: 31, longitude: -98 }),
        makeShelter({ id: 'near', latitude: 30.27, longitude: -97.74 }),
      ],
    };
    const cache = new MemoryShelterCache();
    const service = new SafetyResourceService({ source, cache, now: () => new Date('2026-08-08T00:00:00.000Z') });

    const feed = await service.getFeed(location);

    expect(feed.source).toBe('live');
    expect(feed.isOffline).toBe(false);
    expect(feed.shelters.map((shelter) => shelter.id)).toEqual(['near', 'far']);
    expect(feed.shelters[0]?.distanceMiles).toBeLessThan(1);
    expect(cache.value?.shelters).toHaveLength(2);
  });

  it('returns a truthful live empty state when FEMA reports no nearby open shelters', async () => {
    const source: ShelterSource = { getNearby: async () => [] };
    const service = new SafetyResourceService({ source, cache: new MemoryShelterCache(), now: () => new Date('2026-08-08T00:00:00.000Z') });

    const feed = await service.getFeed(location);

    expect(feed).toMatchObject({ shelters: [], source: 'live', isOffline: false, isStale: false, radiusMiles: 100 });
  });

  it('falls back to saved shelter data and discloses staleness', async () => {
    const source: ShelterSource = { getNearby: async () => { throw new Error('network unavailable'); } };
    const cache = new MemoryShelterCache();
    cache.value = { shelters: [makeShelter()], retrievedAt: '2026-08-07T22:00:00.000Z', radiusMiles: 100 };
    const service = new SafetyResourceService({ source, cache, now: () => new Date('2026-08-08T00:00:00.000Z') });

    const feed = await service.getFeed(location);

    expect(feed.source).toBe('cache');
    expect(feed.isOffline).toBe(true);
    expect(feed.isStale).toBe(true);
    expect(feed.shelters).toHaveLength(1);
  });

  it('returns unavailable when live and saved data cannot be read', async () => {
    const source: ShelterSource = { getNearby: async () => { throw new Error('network unavailable'); } };
    const cache: ShelterCache = {
      get: async () => { throw new Error('storage unavailable'); },
      set: async () => undefined,
    };
    const service = new SafetyResourceService({ source, cache, now: () => new Date('2026-08-08T00:00:00.000Z') });

    const feed = await service.getFeed(location);

    expect(feed).toMatchObject({ shelters: [], source: 'unavailable', isOffline: true, retrievedAt: null });
  });
});
