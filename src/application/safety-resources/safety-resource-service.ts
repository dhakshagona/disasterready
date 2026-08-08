import type { Shelter } from '@/domain/models';
import type { ShelterSearchPoint } from '@/infrastructure/fema/client';

export type ShelterCacheEntry = {
  shelters: Shelter[];
  retrievedAt: string;
  radiusMiles: number;
};

export interface ShelterSource {
  getNearby(point: ShelterSearchPoint, radiusMiles: number, retrievedAt: string): Promise<Shelter[]>;
}

export interface ShelterCache {
  get(locationId: string): Promise<ShelterCacheEntry | null>;
  set(locationId: string, entry: ShelterCacheEntry): Promise<void>;
}

export type SafetyResourceLocation = ShelterSearchPoint & { id: string };

export type ShelterFeed = {
  shelters: Shelter[];
  source: 'live' | 'cache' | 'unavailable';
  isOffline: boolean;
  isStale: boolean;
  retrievedAt: string | null;
  radiusMiles: number;
  error?: string;
};

type SafetyResourceServiceOptions = {
  source: ShelterSource;
  cache: ShelterCache;
  now?: () => Date;
  radiusMiles?: number;
};

const staleAfterMs = 30 * 60 * 1000;

function toRadians(value: number): number {
  return value * Math.PI / 180;
}

function distanceMiles(origin: ShelterSearchPoint, destination: ShelterSearchPoint): number {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function withDistances(shelters: Shelter[], point: ShelterSearchPoint): Shelter[] {
  return shelters
    .map((shelter) => ({ ...shelter, distanceMiles: distanceMiles(point, shelter) }))
    .sort((left, right) => (left.distanceMiles ?? Number.POSITIVE_INFINITY) - (right.distanceMiles ?? Number.POSITIVE_INFINITY));
}

export class SafetyResourceService {
  private readonly source: ShelterSource;
  private readonly cache: ShelterCache;
  private readonly now: () => Date;
  private readonly radiusMiles: number;

  constructor({ source, cache, now = () => new Date(), radiusMiles = 100 }: SafetyResourceServiceOptions) {
    this.source = source;
    this.cache = cache;
    this.now = now;
    this.radiusMiles = radiusMiles;
  }

  async getFeed(location: SafetyResourceLocation): Promise<ShelterFeed> {
    const retrievedAt = this.now().toISOString();
    const point = { latitude: location.latitude, longitude: location.longitude };
    try {
      const shelters = withDistances(await this.source.getNearby(point, this.radiusMiles, retrievedAt), point);
      const entry = { shelters, retrievedAt, radiusMiles: this.radiusMiles };
      await this.cache.set(location.id, entry).catch(() => undefined);
      return {
        shelters,
        source: 'live',
        isOffline: false,
        isStale: false,
        retrievedAt,
        radiusMiles: this.radiusMiles,
      };
    } catch {
      const cached = await this.cache.get(location.id).catch(() => null);
      if (!cached) {
        return {
          shelters: [],
          source: 'unavailable',
          isOffline: true,
          isStale: false,
          retrievedAt: null,
          radiusMiles: this.radiusMiles,
          error: 'Unable to reach the FEMA shelter source, and no saved shelter data is available.',
        };
      }
      const isStale = this.now().getTime() - Date.parse(cached.retrievedAt) > staleAfterMs;
      return {
        shelters: withDistances(cached.shelters, point),
        source: 'cache',
        isOffline: true,
        isStale,
        retrievedAt: cached.retrievedAt,
        radiusMiles: cached.radiusMiles,
        error: 'Live shelter data is unavailable. Showing saved FEMA results.',
      };
    }
  }
}
