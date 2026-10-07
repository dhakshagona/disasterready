export const analyticsEventNames = [
  'session_started',
  'alerts_fetched',
  'alerts_normalized',
  'action_plan_opened',
  'checklist_started',
  'checklist_completed',
  'shelter_lookup',
  'demo_session_started',
  'ai_simplification_requested',
  'ai_simplification_used',
  'ai_simplification_fallback',
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type AnalyticsHazard = 'flood' | 'tornado' | 'hurricane' | 'wildfire' | 'air-quality' | 'winter-storm' | 'earthquake' | 'other';
export type AnalyticsFeedSource = 'live' | 'cache' | 'unavailable';
export type AnalyticsFallbackReason = 'not-configured' | 'unsupported' | 'timeout' | 'provider-error' | 'rate-limited' | 'schema-invalid' | 'safety-invalid';

export type AnalyticsEventPropertiesByName = {
  session_started: Record<string, never>;
  alerts_fetched: { source: AnalyticsFeedSource; activeCount: number; recentCount: number; hazards: AnalyticsHazard[] };
  alerts_normalized: { count: number; hazards: AnalyticsHazard[] };
  action_plan_opened: { hazard: AnalyticsHazard; stepCount: number };
  checklist_started: { hazard: AnalyticsHazard; stepCount: number };
  checklist_completed: { hazard: AnalyticsHazard; stepCount: number };
  shelter_lookup: { source: AnalyticsFeedSource; count: number; stale: boolean };
  demo_session_started: { hazard: AnalyticsHazard; entry: 'home' };
  ai_simplification_requested: { hazard: AnalyticsHazard };
  ai_simplification_used: { hazard: AnalyticsHazard };
  ai_simplification_fallback: { hazard: AnalyticsHazard; reason: AnalyticsFallbackReason };
};

type StoredAnalyticsEventBase<Name extends AnalyticsEventName> = {
  id: string;
  sessionId: string;
  name: Name;
  occurredAt: string;
  mode: 'real' | 'demo';
  properties: AnalyticsEventPropertiesByName[Name];
};

export type StoredAnalyticsEvent = {
  [Name in AnalyticsEventName]: StoredAnalyticsEventBase<Name>;
}[AnalyticsEventName];

const allowedProperties: Record<AnalyticsEventName, readonly string[]> = {
  session_started: [],
  alerts_fetched: ['source', 'activeCount', 'recentCount', 'hazards'],
  alerts_normalized: ['count', 'hazards'],
  action_plan_opened: ['hazard', 'stepCount'],
  checklist_started: ['hazard', 'stepCount'],
  checklist_completed: ['hazard', 'stepCount'],
  shelter_lookup: ['source', 'count', 'stale'],
  demo_session_started: ['hazard', 'entry'],
  ai_simplification_requested: ['hazard'],
  ai_simplification_used: ['hazard'],
  ai_simplification_fallback: ['hazard', 'reason'],
};

const hazards = ['flood', 'tornado', 'hurricane', 'wildfire', 'air-quality', 'winter-storm', 'earthquake', 'other'] as const;
const feedSources = ['live', 'cache', 'unavailable'] as const;
const fallbackReasons = ['not-configured', 'unsupported', 'timeout', 'provider-error', 'rate-limited', 'schema-invalid', 'safety-invalid'] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseText(value: unknown, field: string, maxLength = 128): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`Invalid analytics ${field}`);
  }
  return value;
}

function parseUuid(value: unknown, field: string): string {
  const parsed = parseText(value, field, 36);
  if (!uuidPattern.test(parsed)) throw new Error(`Invalid analytics ${field}`);
  return parsed;
}

function parseProperty(value: unknown): string | number | boolean | string[] {
  if (typeof value === 'string' && value.length <= 64) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1_000_000) return value;
  if (Array.isArray(value) && value.length <= 10 && value.every((item) => typeof item === 'string' && item.length <= 32)) {
    return [...value];
  }
  throw new Error('Invalid analytics properties value');
}

function assertExactKeys(properties: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(properties).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error('Invalid analytics properties');
  }
}

function parseEnum<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error('Invalid analytics properties value');
  return value as T;
}

function parseCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error('Invalid analytics properties value');
  }
  return value;
}

function parseHazards(value: unknown): AnalyticsHazard[] {
  if (!Array.isArray(value) || value.length > hazards.length) throw new Error('Invalid analytics properties value');
  const parsed = value.map((hazard) => parseEnum(hazard, hazards));
  if (new Set(parsed).size !== parsed.length) throw new Error('Invalid analytics properties value');
  return parsed;
}

function parseProperties(name: AnalyticsEventName, value: Record<string, unknown>): StoredAnalyticsEvent['properties'] {
  assertExactKeys(value, allowedProperties[name]);
  switch (name) {
    case 'session_started':
      return {};
    case 'alerts_fetched':
      return {
        source: parseEnum(value.source, feedSources),
        activeCount: parseCount(value.activeCount),
        recentCount: parseCount(value.recentCount),
        hazards: parseHazards(value.hazards),
      };
    case 'alerts_normalized':
      return { count: parseCount(value.count), hazards: parseHazards(value.hazards) };
    case 'action_plan_opened':
    case 'checklist_started':
    case 'checklist_completed':
      return { hazard: parseEnum(value.hazard, hazards), stepCount: parseCount(value.stepCount) };
    case 'shelter_lookup':
      if (typeof value.stale !== 'boolean') throw new Error('Invalid analytics properties value');
      return { source: parseEnum(value.source, feedSources), count: parseCount(value.count), stale: value.stale };
    case 'demo_session_started':
      return { hazard: parseEnum(value.hazard, hazards), entry: parseEnum(value.entry, ['home'] as const) };
    case 'ai_simplification_requested':
    case 'ai_simplification_used':
      return { hazard: parseEnum(value.hazard, hazards) };
    case 'ai_simplification_fallback':
      return { hazard: parseEnum(value.hazard, hazards), reason: parseEnum(value.reason, fallbackReasons) };
  }
}

export function parseAnalyticsEvent(value: unknown, receivedAt?: Date): StoredAnalyticsEvent {
  if (!isRecord(value)) throw new Error('Invalid analytics event');
  const keys = Object.keys(value).sort();
  if (keys.join(',') !== 'id,mode,name,occurredAt,properties,sessionId') throw new Error('Invalid analytics event shape');
  const name = parseText(value.name, 'name', 64);
  if (!analyticsEventNames.includes(name as AnalyticsEventName)) throw new Error('Invalid analytics name');
  if (value.mode !== 'real' && value.mode !== 'demo') throw new Error('Invalid analytics mode');
  const occurredAt = parseText(value.occurredAt, 'occurredAt', 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(occurredAt) || Number.isNaN(Date.parse(occurredAt))) {
    throw new Error('Invalid analytics occurredAt');
  }
  if (receivedAt) {
    const eventTime = Date.parse(occurredAt);
    const skew = eventTime - receivedAt.getTime();
    if (skew > 5 * 60 * 1000 || skew < -30 * 24 * 60 * 60 * 1000) throw new Error('Invalid analytics occurredAt');
  }
  const eventName = name as AnalyticsEventName;
  const rawProperties = value.properties;
  if (!isRecord(rawProperties)) throw new Error('Invalid analytics properties');
  Object.values(rawProperties).forEach(parseProperty);
  const properties = parseProperties(eventName, rawProperties);

  return {
    id: parseUuid(value.id, 'id'),
    sessionId: parseUuid(value.sessionId, 'sessionId'),
    name: eventName,
    occurredAt,
    mode: value.mode,
    properties,
  } as StoredAnalyticsEvent;
}

export function parseAnalyticsBatch(value: unknown, receivedAt?: Date): StoredAnalyticsEvent[] {
  if (!isRecord(value) || !Array.isArray(value.events)) throw new Error('Invalid analytics batch');
  if (Object.keys(value).length !== 1 || !Object.hasOwn(value, 'events')) throw new Error('Invalid analytics batch shape');
  if (!value.events.length || value.events.length > 25) throw new Error('Analytics batch must contain 1 to 25 events');
  return value.events.map((event) => parseAnalyticsEvent(event, receivedAt));
}
