import { describe, expect, it, jest } from '@jest/globals';

import { AnalyticsService, type AnalyticsEvent, type AnalyticsOutbox } from '@/application/analytics/analytics-service';

class MemoryOutbox implements AnalyticsOutbox {
  events: AnalyticsEvent[] = [];

  async append(event: AnalyticsEvent) {
    this.events.push(event);
  }

  async list(limit: number) {
    return this.events.slice(0, limit);
  }

  async remove(ids: string[]) {
    const removed = new Set(ids);
    this.events = this.events.filter((event) => !removed.has(event.id));
  }
}

function service(options: { outbox?: AnalyticsOutbox; send?: (events: AnalyticsEvent[]) => Promise<void> } = {}) {
  const outbox = options.outbox ?? new MemoryOutbox();
  const send = options.send ?? jest.fn(async () => undefined);
  return {
    analytics: new AnalyticsService({
      outbox,
      transport: { send },
      now: () => new Date('2026-08-08T02:00:00.000Z'),
      createId: (() => {
        let next = 0;
        return () => `id-${++next}`;
      })(),
      sessionId: 'session-1',
    }),
    outbox,
    send,
  };
}

describe('analytics service', () => {
  it('stores and sends a coarse event without location or alert content', async () => {
    const { analytics, outbox, send } = service();

    await analytics.track('alerts_fetched', {
      mode: 'real',
      properties: { source: 'live', count: 2, hazards: ['flood', 'tornado'] },
    });

    expect(send).toHaveBeenCalledWith([{
      id: 'id-1',
      sessionId: 'session-1',
      name: 'alerts_fetched',
      occurredAt: '2026-08-08T02:00:00.000Z',
      mode: 'real',
      properties: { source: 'live', count: 2, hazards: ['flood', 'tornado'] },
    }]);
    expect((outbox as MemoryOutbox).events).toEqual([]);
  });

  it('keeps demo activity explicitly separate from real activity', async () => {
    const { analytics, send } = service();

    await analytics.track('demo_session_started', { mode: 'demo' });

    expect(send).toHaveBeenCalledWith([expect.objectContaining({ name: 'demo_session_started', mode: 'demo' })]);
  });

  it('retains queued events when remote delivery fails', async () => {
    const outbox = new MemoryOutbox();
    const { analytics } = service({ outbox, send: async () => { throw new Error('offline'); } });

    await analytics.track('shelter_lookup', { mode: 'real', properties: { result: 'unavailable', count: 0 } });

    expect(outbox.events).toHaveLength(1);
  });

  it('never interrupts an emergency flow when local analytics storage fails', async () => {
    const outbox: AnalyticsOutbox = {
      append: async () => { throw new Error('storage unavailable'); },
      list: async () => [],
      remove: async () => undefined,
    };
    const { analytics, send } = service({ outbox });

    await expect(analytics.track('action_plan_opened', { mode: 'real', properties: { hazard: 'flood' } })).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
