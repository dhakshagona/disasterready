import { describe, expect, it, jest } from '@jest/globals';

import {
  AnalyticsService,
  AnalyticsTransportError,
  type AnalyticsEvent,
  type AnalyticsOutbox,
} from '@/application/analytics/analytics-service';

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
        return () => `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`;
      })(),
      sessionId: '00000000-0000-4000-8000-000000000100',
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
      properties: { source: 'live', activeCount: 2, recentCount: 1, hazards: ['flood', 'tornado'] },
    });

    expect(send).toHaveBeenCalledWith([{
      id: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000100',
      name: 'alerts_fetched',
      occurredAt: '2026-08-08T02:00:00.000Z',
      mode: 'real',
      properties: { source: 'live', activeCount: 2, recentCount: 1, hazards: ['flood', 'tornado'] },
    }]);
    expect((outbox as MemoryOutbox).events).toEqual([]);
  });

  it('keeps demo activity explicitly separate from real activity', async () => {
    const { analytics, send } = service();

    await analytics.track('demo_session_started', { mode: 'demo', properties: { hazard: 'flood', entry: 'home' } });

    expect(send).toHaveBeenCalledWith([expect.objectContaining({ name: 'demo_session_started', mode: 'demo' })]);
  });

  it('retains queued events when remote delivery fails', async () => {
    const outbox = new MemoryOutbox();
    const { analytics } = service({ outbox, send: async () => { throw new Error('offline'); } });

    await analytics.track('shelter_lookup', { mode: 'real', properties: { source: 'unavailable', count: 0, stale: false } });

    expect(outbox.events).toHaveLength(1);
  });

  it('never interrupts an emergency flow when local analytics storage fails', async () => {
    const outbox: AnalyticsOutbox = {
      append: async () => { throw new Error('storage unavailable'); },
      list: async () => [],
      remove: async () => undefined,
    };
    const { analytics, send } = service({ outbox });

    await expect(analytics.track('action_plan_opened', { mode: 'real', properties: { hazard: 'flood', stepCount: 5 } })).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it('drops contract-invalid events before they can poison the outbox', async () => {
    const { analytics, outbox, send } = service();

    // @ts-expect-error Runtime validation still protects JavaScript and persisted boundaries.
    await analytics.track('alerts_fetched', { mode: 'real', properties: { source: 'live', activeCount: -1 } });

    expect((outbox as MemoryOutbox).events).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it('isolates deterministic server rejections so one event cannot poison the outbox', async () => {
    const outbox = new MemoryOutbox();
    outbox.events = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        sessionId: '00000000-0000-4000-8000-000000000100',
        name: 'session_started',
        occurredAt: '2026-08-08T02:00:00.000Z',
        mode: 'real',
        properties: {},
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        sessionId: '00000000-0000-4000-8000-000000000100',
        name: 'session_started',
        occurredAt: '2026-08-08T02:00:00.000Z',
        mode: 'real',
        properties: {},
      },
    ];
    const send = jest.fn(async (events: AnalyticsEvent[]) => {
      if (events.length > 1 || events[0]?.id.endsWith('000001')) {
        throw new AnalyticsTransportError('invalid event', 422, false);
      }
    });
    const { analytics } = service({ outbox, send });

    await analytics.flush();

    expect(send).toHaveBeenCalledTimes(3);
    expect(outbox.events).toEqual([]);
  });

  it('keeps retryable individual failures after isolating a rejected batch', async () => {
    const outbox = new MemoryOutbox();
    outbox.events = [{
      id: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000100',
      name: 'session_started',
      occurredAt: '2026-08-08T02:00:00.000Z',
      mode: 'real',
      properties: {},
    }];
    const send = jest.fn(async () => {
      if (send.mock.calls.length === 1) throw new AnalyticsTransportError('invalid batch', 422, false);
      throw new AnalyticsTransportError('service unavailable', 503, true);
    });
    const { analytics } = service({ outbox, send });

    await expect(analytics.flush()).rejects.toThrow('service unavailable');
    expect(outbox.events).toHaveLength(1);
  });
});
