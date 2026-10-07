import type { Alert, AlertCertainty, AlertSeverity, AlertUrgency, HazardType } from '@/domain/models';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalString(record: UnknownRecord, key: string): string | undefined {
  return requiredString(record, key) ?? undefined;
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `nws-${(hash >>> 0).toString(36)}`;
}

function normalizeEnum<T extends string>(value: string | null, allowed: readonly T[]): T | 'unknown' {
  const normalized = value?.toLowerCase();
  return allowed.includes(normalized as T) ? (normalized as T) : 'unknown';
}

function mapHazard(event: string): HazardType {
  const normalized = event.toLowerCase();
  if (normalized.includes('tornado')) return 'tornado';
  if (
    normalized.includes('hurricane') ||
    normalized.includes('tropical cyclone') ||
    normalized.includes('tropical storm') ||
    normalized.includes('storm surge')
  ) return 'hurricane';
  if (normalized.includes('flood') || normalized.includes('hydrologic')) return 'flood';
  if (normalized.includes('red flag') || normalized.includes('fire weather') || normalized.includes('wildfire')) return 'wildfire';
  if (normalized.includes('air quality') || normalized.includes('smoke')) return 'air-quality';
  if (
    normalized.includes('winter') ||
    normalized.includes('snow') ||
    normalized.includes('blizzard') ||
    normalized.includes('ice') ||
    normalized.includes('freeze') ||
    normalized.includes('frost') ||
    normalized.includes('wind chill')
  ) return 'winter-storm';
  if (normalized.includes('earthquake')) return 'earthquake';
  return 'other';
}

function firstSentence(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  const sentenceEnd = compact.search(/[.!?](?:\s|$)/);
  return sentenceEnd >= 0 ? compact.slice(0, sentenceEnd + 1) : compact;
}

export function normalizeNwsFeature(feature: unknown, retrievedAt: string): Alert | null {
  if (!isRecord(feature) || !isRecord(feature.properties)) return null;
  const properties = feature.properties;
  const providerId = requiredString(properties, 'id') ?? requiredString(feature, 'id');
  const event = requiredString(properties, 'event');
  const headline = requiredString(properties, 'headline') ?? event;
  const areaDescription = requiredString(properties, 'areaDesc');
  const issuedAt = requiredString(properties, 'sent') ?? requiredString(properties, 'effective');
  const expiresAt = requiredString(properties, 'expires') ?? requiredString(properties, 'ends');
  const description = requiredString(properties, 'description') ?? requiredString(properties, 'instruction') ?? headline;

  if (!providerId || !event || !headline || !areaDescription || !issuedAt || !expiresAt || !description) return null;

  const instruction = optionalString(properties, 'instruction');
  const messageType = optionalString(properties, 'messageType')?.toLowerCase();
  const isExpired = messageType === 'cancel' || Date.parse(expiresAt) <= Date.parse(retrievedAt);
  const sourceUrl = optionalString(feature, 'id');
  const base: Alert = {
    id: stableId(providerId),
    providerId,
    hazard: mapHazard(event),
    headline,
    summary: firstSentence(description),
    severity: normalizeEnum<AlertSeverity>(requiredString(properties, 'severity'), ['minor', 'moderate', 'severe', 'extreme']),
    urgency: normalizeEnum<AlertUrgency>(requiredString(properties, 'urgency'), ['past', 'future', 'expected', 'immediate']),
    certainty: normalizeEnum<AlertCertainty>(requiredString(properties, 'certainty'), ['unlikely', 'possible', 'likely', 'observed']),
    status: isExpired ? 'expired' : 'active',
    areaDescription,
    issuedAt,
    expiresAt,
    source: optionalString(properties, 'senderName') ?? 'National Weather Service',
    originalText: instruction ? `${description}\n\n${instruction}` : description,
    ...(instruction ? { instructionText: instruction } : {}),
    retrievedAt,
    freshness: 'current',
    isDemo: false,
    doNow: [],
  };
  return sourceUrl ? { ...base, sourceUrl } : base;
}

export function parseNwsFeatureCollection(payload: unknown, retrievedAt: string): Alert[] {
  if (!isRecord(payload) || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
    throw new Error('Invalid NWS feature collection');
  }
  return payload.features.flatMap((feature) => {
    const alert = normalizeNwsFeature(feature, retrievedAt);
    return alert ? [alert] : [];
  });
}
