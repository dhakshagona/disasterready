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

export type StoredAnalyticsEvent = {
  id: string;
  sessionId: string;
  name: (typeof analyticsEventNames)[number];
  occurredAt: string;
  mode: 'real' | 'demo';
  properties: Record<string, string | number | boolean | string[]>;
};

const allowedProperties: Record<StoredAnalyticsEvent['name'], readonly string[]> = {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseText(value: unknown, field: string, maxLength = 128): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`Invalid analytics ${field}`);
  }
  return value;
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

function parseEvent(value: unknown): StoredAnalyticsEvent {
  if (!isRecord(value)) throw new Error('Invalid analytics event');
  const name = parseText(value.name, 'name', 64);
  if (!analyticsEventNames.includes(name as StoredAnalyticsEvent['name'])) throw new Error('Invalid analytics name');
  if (value.mode !== 'real' && value.mode !== 'demo') throw new Error('Invalid analytics mode');
  const occurredAt = parseText(value.occurredAt, 'occurredAt', 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(occurredAt) || Number.isNaN(Date.parse(occurredAt))) {
    throw new Error('Invalid analytics occurredAt');
  }
  const rawProperties = value.properties;
  if (!isRecord(rawProperties)) throw new Error('Invalid analytics properties');

  const eventName = name as StoredAnalyticsEvent['name'];
  const propertyKeys = Object.keys(rawProperties);
  if (propertyKeys.some((key) => !allowedProperties[eventName].includes(key))) {
    throw new Error('Invalid analytics properties');
  }
  const properties = Object.fromEntries(propertyKeys.map((key) => [key, parseProperty(rawProperties[key])]));

  return {
    id: parseText(value.id, 'id'),
    sessionId: parseText(value.sessionId, 'sessionId'),
    name: eventName,
    occurredAt,
    mode: value.mode,
    properties,
  };
}

export function parseAnalyticsBatch(value: unknown): StoredAnalyticsEvent[] {
  if (!isRecord(value) || !Array.isArray(value.events)) throw new Error('Invalid analytics batch');
  if (!value.events.length || value.events.length > 25) throw new Error('Analytics batch must contain 1 to 25 events');
  return value.events.map(parseEvent);
}
