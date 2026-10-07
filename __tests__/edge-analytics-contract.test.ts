import { describe, expect, it } from '@jest/globals';

import { parseAnalyticsBatch } from '../supabase/functions/_shared/analytics-contract';

const validEvent = {
  id: '00000000-0000-4000-8000-000000000001',
  sessionId: '00000000-0000-4000-8000-000000000100',
  name: 'alerts_fetched',
  occurredAt: '2026-08-08T02:00:00.000Z',
  mode: 'real',
  properties: { source: 'live', activeCount: 2, recentCount: 1, hazards: ['flood'] },
};
const receivedAt = new Date('2026-08-08T02:01:00.000Z');

describe('analytics Edge Function contract', () => {
  it('accepts bounded aggregate events and normalizes their storage shape', () => {
    expect(parseAnalyticsBatch({ events: [validEvent] }, receivedAt)).toEqual([{ ...validEvent }]);
  });

  it('rejects contact, location, and arbitrary properties', () => {
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, properties: { email: 'person@example.com' } }] })).toThrow('properties');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, properties: { postalCode: '77002' } }] })).toThrow('properties');
  });

  it('rejects event names, modes, timestamps, and batches outside the contract', () => {
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, name: 'custom_event' }] })).toThrow('name');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, mode: 'unknown' }] })).toThrow('mode');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, occurredAt: 'yesterday' }] })).toThrow('occurredAt');
    expect(() => parseAnalyticsBatch({ events: Array.from({ length: 26 }, () => validEvent) })).toThrow('25');
  });

  it('rejects invalid identifiers and semantically invalid property values', () => {
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, id: 'event-1' }] })).toThrow('id');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, properties: { ...validEvent.properties, activeCount: -1 } }] })).toThrow('value');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, properties: { ...validEvent.properties, source: 'invented' } }] })).toThrow('value');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, properties: { ...validEvent.properties, hazards: ['flood', 'flood'] } }] })).toThrow('value');
  });

  it('rejects events outside the accepted client clock window', () => {
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, occurredAt: '2026-09-08T02:00:00.000Z' }] }, receivedAt)).toThrow('occurredAt');
    expect(() => parseAnalyticsBatch({ events: [{ ...validEvent, occurredAt: '2026-07-01T02:00:00.000Z' }] }, receivedAt)).toThrow('occurredAt');
  });
});
