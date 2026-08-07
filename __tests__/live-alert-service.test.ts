import { LiveAlertService, type AlertCache, type AlertCacheEntry, type AlertSource } from '@/application/alerts/live-alert-service';
import type { Alert, UserPreferences } from '@/domain/models';
import { describe, expect, it } from '@jest/globals';

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'nws-flood-1',
    providerId: 'provider-flood-1',
    hazard: 'flood',
    headline: 'Flash Flood Warning',
    summary: 'Flash flooding is occurring.',
    severity: 'severe',
    urgency: 'immediate',
    certainty: 'observed',
    status: 'active',
    areaDescription: 'Travis County, Texas',
    issuedAt: '2026-08-07T20:00:00.000Z',
    expiresAt: '2026-08-07T22:00:00.000Z',
    source: 'National Weather Service',
    originalText: 'Official text',
    retrievedAt: '2026-08-07T20:05:00.000Z',
    freshness: 'current',
    isDemo: false,
    doNow: [],
    ...overrides,
  };
}

const preferences: UserPreferences = {
  hazards: ['flood'],
  location: {
    id: 'austin',
    label: 'Home',
    city: 'Austin',
    region: 'TX',
    postalCode: '78701',
    latitude: 30.2672,
    longitude: -97.7431,
  },
  notificationsEnabled: false,
  language: 'en',
  textSize: 'standard',
  highContrast: false,
  plainLanguage: true,
  reducedMotion: false,
};

class MemoryCache implements AlertCache {
  value: AlertCacheEntry | null = null;

  async get() {
    return this.value;
  }

  async set(_locationId: string, entry: AlertCacheEntry) {
    this.value = entry;
  }
}

describe('live alert service', () => {
  it('filters live alerts by preferences, retains unknown hazards, and attaches reviewed actions', async () => {
    const source: AlertSource = {
      getActive: async () => [
        makeAlert(),
        makeAlert({ id: 'nws-tornado-1', providerId: 'provider-tornado-1', hazard: 'tornado' }),
        makeAlert({ id: 'nws-other-1', providerId: 'provider-other-1', hazard: 'other', headline: 'Heat Advisory' }),
      ],
    };
    const cache = new MemoryCache();
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.source).toBe('live');
    expect(feed.isOffline).toBe(false);
    expect(feed.active.map((alert) => alert.id)).toEqual(['nws-flood-1', 'nws-other-1']);
    expect(feed.active[0]?.doNow).toHaveLength(3);
    expect(feed.active[1]?.doNow).toEqual([]);
    expect(cache.value?.alerts).toHaveLength(3);
  });

  it('returns cached alerts with disclosed freshness when the live source fails', async () => {
    const source: AlertSource = { getActive: async () => { throw new Error('network unavailable'); } };
    const cache = new MemoryCache();
    cache.value = { alerts: [makeAlert()], retrievedAt: '2026-08-07T19:45:00.000Z' };
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.source).toBe('cache');
    expect(feed.isOffline).toBe(true);
    expect(feed.active[0]?.freshness).toBe('cached');
    expect(feed.error).toBe('Live alerts are unavailable. Showing saved data.');
  });

  it('moves alerts that disappeared from the active feed into recent history', async () => {
    const source: AlertSource = { getActive: async () => [makeAlert()] };
    const cache = new MemoryCache();
    cache.value = {
      alerts: [makeAlert({ id: 'nws-old-flood', providerId: 'provider-old-flood' })],
      retrievedAt: '2026-08-07T19:45:00.000Z',
    };
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.active.map((alert) => alert.id)).toEqual(['nws-flood-1']);
    expect(feed.recent).toEqual([expect.objectContaining({ id: 'nws-old-flood', status: 'expired', freshness: 'cached' })]);
    expect(cache.value?.alerts).toHaveLength(2);
  });

  it('marks cached alerts stale after one hour', async () => {
    const source: AlertSource = { getActive: async () => { throw new Error('network unavailable'); } };
    const cache = new MemoryCache();
    cache.value = { alerts: [makeAlert()], retrievedAt: '2026-08-07T18:00:00.000Z' };
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.active[0]?.freshness).toBe('stale');
  });

  it('returns an explicit unavailable state when live and cached data are both unavailable', async () => {
    const source: AlertSource = { getActive: async () => { throw new Error('network unavailable'); } };
    const service = new LiveAlertService({ source, cache: new MemoryCache(), now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed).toMatchObject({
      active: [],
      recent: [],
      source: 'unavailable',
      isOffline: true,
      retrievedAt: null,
      error: 'Unable to reach the National Weather Service, and no saved alert data is available.',
    });
  });

  it('does not discard a successful live response when writing the cache fails', async () => {
    const source: AlertSource = { getActive: async () => [makeAlert()] };
    const cache: AlertCache = {
      get: async () => null,
      set: async () => { throw new Error('storage unavailable'); },
    };
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.source).toBe('live');
    expect(feed.active).toHaveLength(1);
    expect(feed.isOffline).toBe(false);
  });

  it('reuses the latest successful response within the NWS thirty-second polling window', async () => {
    let requestCount = 0;
    let now = new Date('2026-08-07T20:05:00.000Z');
    const source: AlertSource = {
      getActive: async () => {
        requestCount += 1;
        return [makeAlert()];
      },
    };
    const service = new LiveAlertService({ source, cache: new MemoryCache(), now: () => now });

    const first = await service.getFeed(preferences);
    now = new Date('2026-08-07T20:05:10.000Z');
    const second = await service.getFeed(preferences);

    expect(first.source).toBe('live');
    expect(second.source).toBe('live');
    expect(second.isOffline).toBe(false);
    expect(requestCount).toBe(1);
  });

  it('returns unavailable when both the network and local cache reader fail', async () => {
    const source: AlertSource = { getActive: async () => { throw new Error('network unavailable'); } };
    const cache: AlertCache = {
      get: async () => { throw new Error('storage unavailable'); },
      set: async () => undefined,
    };
    const service = new LiveAlertService({ source, cache, now: () => new Date('2026-08-07T20:05:00.000Z') });

    const feed = await service.getFeed(preferences);

    expect(feed.source).toBe('unavailable');
    expect(feed.error).toContain('no saved alert data');
  });
});
