import type { AlertCache, AlertCacheEntry } from '@/application/alerts/live-alert-service';
import type { ActionStep, Alert, UserPreferences } from '@/domain/models';
import type { KeyValueStorage } from '@/infrastructure/storage/storage-port';

const supportedHazards = new Set(['flood', 'tornado', 'hurricane', 'wildfire', 'air-quality', 'winter-storm', 'earthquake', 'other']);
const supportedSeverities = new Set(['minor', 'moderate', 'severe', 'extreme', 'unknown']);
const supportedUrgencies = new Set(['past', 'future', 'expected', 'immediate', 'unknown']);
const supportedCertainties = new Set(['unlikely', 'possible', 'likely', 'observed', 'unknown']);
const supportedFreshness = new Set(['current', 'cached', 'stale']);

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActionStep(value: unknown): value is ActionStep {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' && typeof value.detail === 'string' && typeof value.priority === 'number';
}

function isStoredAlert(value: unknown): value is Alert {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.providerId === 'string' &&
    typeof value.hazard === 'string' && supportedHazards.has(value.hazard) &&
    typeof value.headline === 'string' &&
    typeof value.summary === 'string' &&
    typeof value.severity === 'string' && supportedSeverities.has(value.severity) &&
    typeof value.urgency === 'string' && supportedUrgencies.has(value.urgency) &&
    typeof value.certainty === 'string' && supportedCertainties.has(value.certainty) &&
    (value.status === 'active' || value.status === 'expired') &&
    typeof value.areaDescription === 'string' &&
    typeof value.issuedAt === 'string' &&
    typeof value.expiresAt === 'string' &&
    typeof value.source === 'string' &&
    typeof value.originalText === 'string' &&
    (value.sourceUrl === undefined || typeof value.sourceUrl === 'string') &&
    typeof value.retrievedAt === 'string' &&
    typeof value.freshness === 'string' && supportedFreshness.has(value.freshness) &&
    typeof value.isDemo === 'boolean' &&
    Array.isArray(value.doNow) && value.doNow.every(isActionStep)
  );
}

function isAlertCacheEntry(value: unknown): value is AlertCacheEntry {
  return isRecord(value) && Array.isArray(value.alerts) && value.alerts.every(isStoredAlert) && typeof value.retrievedAt === 'string';
}

function isUserPreferences(value: unknown): value is UserPreferences {
  if (!isRecord(value) || !Array.isArray(value.hazards) || !isRecord(value.location)) return false;
  const { location } = value;
  return (
    value.hazards.every((hazard) => typeof hazard === 'string' && supportedHazards.has(hazard)) &&
    typeof location.id === 'string' &&
    typeof location.label === 'string' &&
    typeof location.city === 'string' &&
    typeof location.region === 'string' &&
    typeof location.postalCode === 'string' &&
    typeof location.latitude === 'number' && Number.isFinite(location.latitude) && location.latitude >= -90 && location.latitude <= 90 &&
    typeof location.longitude === 'number' && Number.isFinite(location.longitude) && location.longitude >= -180 && location.longitude <= 180 &&
    typeof value.notificationsEnabled === 'boolean' &&
    (value.language === 'en' || value.language === 'es') &&
    typeof value.highContrast === 'boolean' &&
    typeof value.plainLanguage === 'boolean' &&
    typeof value.reducedMotion === 'boolean' &&
    (value.textSize === 'standard' || value.textSize === 'large' || value.textSize === 'extra-large')
  );
}

export class LocalAlertCache implements AlertCache {
  constructor(private readonly storage: KeyValueStorage) {}

  async get(locationId: string): Promise<AlertCacheEntry | null> {
    const value = parseJson(await this.storage.getItem(`alerts:${locationId}`));
    return isAlertCacheEntry(value) ? value : null;
  }

  async set(locationId: string, entry: AlertCacheEntry): Promise<void> {
    await this.storage.setItem(`alerts:${locationId}`, JSON.stringify(entry));
  }
}

export class LocalChecklistProgressRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async getCompleted(planId: string): Promise<Set<string>> {
    const value = parseJson(await this.storage.getItem(`checklist:${planId}`));
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  }

  async setCompleted(planId: string, completedIds: Set<string>): Promise<void> {
    await this.storage.setItem(`checklist:${planId}`, JSON.stringify([...completedIds]));
  }
}

export class LocalPreferencesRepository {
  private readonly key = 'preferences:guest';

  constructor(private readonly storage: KeyValueStorage) {}

  async get(): Promise<UserPreferences | null> {
    const value = parseJson(await this.storage.getItem(this.key));
    return isUserPreferences(value) ? value : null;
  }

  async save(preferences: UserPreferences): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(preferences));
  }
}
