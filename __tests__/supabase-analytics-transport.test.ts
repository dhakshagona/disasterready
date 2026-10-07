import { describe, expect, it, jest } from '@jest/globals';

import { AnalyticsTransportError, type AnalyticsEvent } from '@/application/analytics/analytics-service';
import { SupabaseAnalyticsTransport } from '@/infrastructure/analytics/supabase-analytics-transport';

const event: AnalyticsEvent = {
  id: '00000000-0000-4000-8000-000000000001',
  sessionId: '00000000-0000-4000-8000-000000000100',
  name: 'session_started',
  occurredAt: new Date().toISOString(),
  mode: 'real',
  properties: {},
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

    await expect(transport.send(Array.from({ length: 26 }, (_, index) => ({ ...event, id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` })))).rejects.toThrow('Analytics batch exceeds 25 events');
  });

  it('does not send bearer authorization for a public Supabase key', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 202 }));
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      fetcher,
    });

    await transport.send([event]);

    const options = fetcher.mock.calls[0]?.[1];
    expect(options?.headers).not.toHaveProperty('Authorization');
  });

  it('surfaces HTTP failures so the local outbox remains intact', async () => {
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 503 }),
    });

    await expect(transport.send([event])).rejects.toThrow('Analytics delivery failed with status 503');
  });

  it('marks validation responses as deterministic and service responses as retryable', async () => {
    const invalid = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 422 }),
    });
    const unavailable = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 503 }),
    });

    await expect(invalid.send([event])).rejects.toMatchObject({ retryable: false, status: 422 } satisfies Partial<AnalyticsTransportError>);
    await expect(unavailable.send([event])).rejects.toMatchObject({ retryable: true, status: 503 } satisfies Partial<AnalyticsTransportError>);
  });

  it('rejects contract-invalid events before making a network request', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 202 }));
    const transport = new SupabaseAnalyticsTransport({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher,
    });

    const invalidEvent = { ...event, properties: { location: 'Austin' } } as unknown as AnalyticsEvent;
    await expect(transport.send([invalidEvent])).rejects.toThrow('properties');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
