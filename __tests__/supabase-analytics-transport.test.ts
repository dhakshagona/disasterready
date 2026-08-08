import { describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsEvent } from '@/application/analytics/analytics-service';
import { SupabaseAnalyticsTransport } from '@/infrastructure/analytics/supabase-analytics-transport';

const event: AnalyticsEvent = {
  id: 'event-1',
  sessionId: 'session-1',
  name: 'session_started',
  occurredAt: '2026-08-08T02:00:00.000Z',
  mode: 'real',
  properties: { surface: 'web' },
};

describe('Supabase analytics transport', () => {
  it('sends a bounded event batch to the configured Edge Function', async () => {
    const fetcher = jest.fn(async () => new Response(null, { status: 202 }));
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co/',
      publishableKey: 'publishable-test-key',
      fetcher,
    });

    await transport.send([event]);

    expect(fetcher).toHaveBeenCalledWith('https://project.supabase.co/functions/v1/record-events', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ apikey: 'publishable-test-key', 'Content-Type': 'application/json' }),
      body: JSON.stringify({ events: [event] }),
    }));
  });

  it('rejects a batch larger than the server contract permits', async () => {
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 202 }),
    });

    await expect(transport.send(Array.from({ length: 26 }, (_, index) => ({ ...event, id: `event-${index}` })))).rejects.toThrow('Analytics batch exceeds 25 events');
  });

  it('surfaces HTTP failures so the local outbox remains intact', async () => {
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 503 }),
    });

    await expect(transport.send([event])).rejects.toThrow('Analytics delivery failed with status 503');
  });
});
