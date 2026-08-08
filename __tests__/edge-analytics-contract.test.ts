import { describe, expect, it } from '@jest/globals';

import { parseAnalyticsBatch } from '../supabase/functions/_shared/analytics-contract';

const validEvent = {
  id: 'event-1',
  sessionId: 'session-1',
  name: 'alerts_fetched',
  occurredAt: '2026-08-08T02:00:00.000Z',
  mode: 'real',
  properties: { source: 'live', activeCount: 2, recentCount: 1, hazards: ['flood'] },
};

describe('analytics Edge Function contract', () => {
  it('accepts bounded aggregate events and normalizes their storage shape', () => {
    expect(parseAnalyticsBatch({ events: [validEvent] })).toEqual([{ ...validEvent }]);
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
});
