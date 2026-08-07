import { selectActionPlan } from '@/domain/action-plans/select-action-plan';
import type { Alert, DataFreshness, UserPreferences } from '@/domain/models';
import type { GeoPoint } from '@/infrastructure/nws/client';

export type AlertCacheEntry = {
  alerts: Alert[];
  retrievedAt: string;
};

export interface AlertSource {
  getActive(point: GeoPoint, retrievedAt: string): Promise<Alert[]>;
}

export interface AlertCache {
  get(locationId: string): Promise<AlertCacheEntry | null>;
  set(locationId: string, entry: AlertCacheEntry): Promise<void>;
}

export type AlertFeed = {
  active: Alert[];
  recent: Alert[];
  source: 'live' | 'cache' | 'unavailable';
  isOffline: boolean;
  retrievedAt: string | null;
  error?: string;
};

type LiveAlertServiceOptions = {
  source: AlertSource;
  cache: AlertCache;
  now?: () => Date;
};

const staleAfterMs = 60 * 60 * 1000;
const minimumPollIntervalMs = 30 * 1000;

function withReviewedActions(alert: Alert): Alert {
  const plan = selectActionPlan(alert);
  return { ...alert, doNow: plan?.steps.slice(0, 3) ?? [] };
}

function severityRank(alert: Alert) {
  const rank = { unknown: 0, minor: 1, moderate: 2, severe: 3, extreme: 4 } as const;
  return rank[alert.severity];
}

function sortByPriority(alerts: Alert[]): Alert[] {
  return [...alerts].sort((left, right) => {
    const severityDifference = severityRank(right) - severityRank(left);
    if (severityDifference !== 0) return severityDifference;
    if (left.urgency === 'immediate' && right.urgency !== 'immediate') return -1;
    if (right.urgency === 'immediate' && left.urgency !== 'immediate') return 1;
    return Date.parse(right.issuedAt) - Date.parse(left.issuedAt);
  });
}

function filterForPreferences(alerts: Alert[], preferences: UserPreferences): Alert[] {
  return alerts.filter((alert) => alert.hazard === 'other' || preferences.hazards.includes(alert.hazard));
}

function splitFeed(alerts: Alert[], preferences: UserPreferences) {
  const visible = filterForPreferences(alerts, preferences);
  return {
    active: sortByPriority(visible.filter((alert) => alert.status === 'active')),
    recent: sortByPriority(visible.filter((alert) => alert.status === 'expired')),
  };
}

function markCached(alerts: Alert[], freshness: DataFreshness): Alert[] {
  return alerts.map((alert) => withReviewedActions({ ...alert, freshness }));
}

export class LiveAlertService {
  private readonly source: AlertSource;
  private readonly cache: AlertCache;
  private readonly now: () => Date;
  private readonly latestByLocation = new Map<string, AlertCacheEntry>();

  constructor({ source, cache, now = () => new Date() }: LiveAlertServiceOptions) {
    this.source = source;
    this.cache = cache;
    this.now = now;
  }

  async getFeed(preferences: UserPreferences): Promise<AlertFeed> {
    const requestTime = this.now();
    const latest = this.latestByLocation.get(preferences.location.id);
    if (latest && requestTime.getTime() - Date.parse(latest.retrievedAt) < minimumPollIntervalMs) {
      return {
        ...splitFeed(latest.alerts, preferences),
        source: 'live',
        isOffline: false,
        retrievedAt: latest.retrievedAt,
      };
    }

    const retrievedAt = requestTime.toISOString();
    try {
      const liveAlerts = (await this.source.getActive(
        { latitude: preferences.location.latitude, longitude: preferences.location.longitude },
        retrievedAt,
      )).map(withReviewedActions);
      const previous = await this.cache.get(preferences.location.id).catch(() => null);
      const liveIds = new Set(liveAlerts.map((alert) => alert.id));
      const historyCutoff = this.now().getTime() - 7 * 24 * 60 * 60 * 1000;
      const recentAlerts = (previous?.alerts ?? [])
        .filter((alert) => !liveIds.has(alert.id) && !alert.isDemo && Date.parse(alert.issuedAt) >= historyCutoff)
        .map((alert) => withReviewedActions({ ...alert, status: 'expired', freshness: 'cached' }));
      const allAlerts = [...liveAlerts, ...recentAlerts];
      const entry = { alerts: allAlerts, retrievedAt };
      this.latestByLocation.set(preferences.location.id, entry);
      await this.cache.set(preferences.location.id, entry).catch(() => undefined);
      return { ...splitFeed(allAlerts, preferences), source: 'live', isOffline: false, retrievedAt };
    } catch {
      const cached = await this.cache.get(preferences.location.id).catch(() => null);
      if (!cached) {
        return {
          active: [],
          recent: [],
          source: 'unavailable',
          isOffline: true,
          retrievedAt: null,
          error: 'Unable to reach the National Weather Service, and no saved alert data is available.',
        };
      }
      const ageMs = this.now().getTime() - Date.parse(cached.retrievedAt);
      const freshness: DataFreshness = ageMs > staleAfterMs ? 'stale' : 'cached';
      return {
        ...splitFeed(markCached(cached.alerts, freshness), preferences),
        source: 'cache',
        isOffline: true,
        retrievedAt: cached.retrievedAt,
        error: 'Live alerts are unavailable. Showing saved data.',
      };
    }
  }
}
