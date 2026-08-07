import { NwsAlertClient } from '@/infrastructure/nws/client';
import { describe, expect, it, jest } from '@jest/globals';

describe('NWS alert client', () => {
  it('requests active alerts for a point using NWS content negotiation', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), { status: 200 }));
    const client = new NwsAlertClient({ fetcher, platform: 'native' });

    await client.fetchActiveForPoint({ latitude: 30.2672, longitude: -97.7431 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe('https://api.weather.gov/alerts/active?point=30.2672%2C-97.7431');
    expect(options?.headers).toMatchObject({
      Accept: 'application/geo+json',
      'User-Agent': 'DisasterReady/1.0 (public GitHub educational project)',
    });
  });

  it('uses browser-safe headers that pass the NWS CORS policy on web', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response('{}', { status: 200 }));
    const client = new NwsAlertClient({ fetcher, platform: 'web' });

    await client.fetchActiveForPoint({ latitude: 30, longitude: -97 });

    const [, options] = fetcher.mock.calls[0] ?? [];
    expect(options?.headers).not.toHaveProperty('User-Agent');
    expect(options?.headers).not.toHaveProperty('X-Application');
    expect(options?.headers).toMatchObject({ Accept: 'application/geo+json' });
  });

  it('surfaces HTTP failures for the cache layer to handle', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response('rate limited', { status: 429 }));
    const client = new NwsAlertClient({ fetcher, platform: 'native' });

    await expect(client.fetchActiveForPoint({ latitude: 30, longitude: -97 })).rejects.toThrow('NWS request failed with status 429');
  });

  it('rejects invalid coordinates before making a request', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>();
    const client = new NwsAlertClient({ fetcher, platform: 'native' });

    await expect(client.fetchActiveForPoint({ latitude: 120, longitude: -97 })).rejects.toThrow('Invalid alert lookup coordinates');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('aborts a request that exceeds the configured timeout', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const client = new NwsAlertClient({ fetcher, platform: 'native', timeoutMs: 5 });

    await expect(client.fetchActiveForPoint({ latitude: 30, longitude: -97 })).rejects.toThrow('NWS request timed out');
  });
});
