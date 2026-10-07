import { describe, expect, it, jest } from '@jest/globals';

import { consumeRateLimit, hashRateLimitIdentity } from '../supabase/functions/_shared/rate-limit';

const request = new Request('https://example.test', {
  headers: {
    'User-Agent': 'DisasterReady test',
    'X-Forwarded-For': '203.0.113.10',
  },
});

describe('Edge Function rate limit client', () => {
  it('hashes the caller identity with a deployment secret', async () => {
    const first = await hashRateLimitIdentity(request, 'salt-one');
    const second = await hashRateLimitIdentity(request, 'salt-two');

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
  });

  it('uses the protected RPC and maps its boolean result', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response('true', { status: 200 }));

    await expect(consumeRateLimit({
      request,
      projectUrl: 'https://project.supabase.co/',
      secretKey: 'sb_secret_test',
      salt: 'deployment-salt',
      scope: 'simplify-alert',
      limit: 10,
      windowSeconds: 60,
      cost: 3,
      fetcher,
    })).resolves.toBe('allowed');

    expect(fetcher).toHaveBeenCalledWith('https://project.supabase.co/rest/v1/rpc/consume_edge_rate_limits', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ apikey: 'sb_secret_test' }),
      body: expect.stringContaining('"cost":3'),
    }));
  });

  it('fails closed when the rate limit database is unavailable', async () => {
    await expect(consumeRateLimit({
      request,
      projectUrl: 'https://project.supabase.co',
      secretKey: 'sb_secret_test',
      salt: 'deployment-salt',
      scope: 'record-events',
      limit: 60,
      windowSeconds: 60,
      fetcher: async () => new Response(null, { status: 503 }),
    })).resolves.toBe('unavailable');
  });
});
