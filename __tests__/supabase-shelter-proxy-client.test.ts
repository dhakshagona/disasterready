import { describe, expect, it, jest } from '@jest/globals';

import { FallbackFemaShelterClient, SupabaseShelterProxyClient } from '@/infrastructure/fema/supabase-shelter-proxy-client';

describe('Supabase shelter proxy client', () => {
  it('sends the bounded shelter query with only the publishable apikey', async () => {
    const fetcher = jest.fn(async () => new Response(JSON.stringify({ features: [] }), { status: 200 }));
    const client = new SupabaseShelterProxyClient({
      projectUrl: 'https://project.supabase.co/',
      publishableKey: 'sb_publishable_test',
      fetcher,
    });

    await expect(client.fetchNearby({ latitude: 30.2672, longitude: -97.7431 }, 100)).resolves.toEqual({ features: [] });
    expect(fetcher).toHaveBeenCalledWith('https://project.supabase.co/functions/v1/shelter-proxy', expect.objectContaining({
      method: 'POST',
      headers: { apikey: 'sb_publishable_test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 30.2672, longitude: -97.7431, radiusMiles: 100 }),
    }));
  });

  it('falls back to the direct FEMA client when the proxy is unavailable', async () => {
    const primary = { fetchNearby: jest.fn(async () => { throw new Error('proxy unavailable'); }) };
    const fallback = { fetchNearby: jest.fn(async () => ({ features: [] })) };
    const client = new FallbackFemaShelterClient(primary, fallback);

    await expect(client.fetchNearby({ latitude: 30, longitude: -97 }, 100)).resolves.toEqual({ features: [] });
    expect(fallback.fetchNearby).toHaveBeenCalledTimes(1);
  });

  it('rejects a radius outside the server proxy contract', async () => {
    const client = new SupabaseShelterProxyClient({
      projectUrl: 'https://project.supabase.co/',
      publishableKey: 'sb_publishable_test',
      fetcher: async () => new Response(JSON.stringify({ features: [] }), { status: 200 }),
    });

    await expect(client.fetchNearby({ latitude: 30.2672, longitude: -97.7431 }, 101)).rejects.toThrow('proxy search radius');
  });
});
