import { describe, expect, it, jest } from '@jest/globals';

import { FemaShelterClient } from '@/infrastructure/fema/client';

describe('FEMA shelter client', () => {
  it('queries the official open-shelter layer around a point', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ features: [] }), { status: 200 }));
    const client = new FemaShelterClient({ fetcher });

    await client.fetchNearby({ latitude: 30.2672, longitude: -97.7431 }, 100);

    const [url, options] = fetcher.mock.calls[0] ?? [];
    const parsed = new URL(url ?? '');
    expect(`${parsed.origin}${parsed.pathname}`).toBe('https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0/query');
    expect(parsed.searchParams.get('geometry')).toBe('-97.7431,30.2672');
    expect(parsed.searchParams.get('distance')).toBe('100');
    expect(parsed.searchParams.get('units')).toBe('esriSRUnit_StatuteMile');
    expect(parsed.searchParams.get('returnGeometry')).toBe('true');
    expect(options?.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('rejects invalid radiuses before making a request', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>();
    const client = new FemaShelterClient({ fetcher });

    await expect(client.fetchNearby({ latitude: 30, longitude: -97 }, 0)).rejects.toThrow('Invalid shelter search radius');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('surfaces HTTP failures', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response('unavailable', { status: 503 }));
    const client = new FemaShelterClient({ fetcher });

    await expect(client.fetchNearby({ latitude: 30, longitude: -97 }, 100)).rejects.toThrow('FEMA shelter request failed with status 503');
  });

  it('times out slow requests', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const client = new FemaShelterClient({ fetcher, timeoutMs: 5 });

    await expect(client.fetchNearby({ latitude: 30, longitude: -97 }, 100)).rejects.toThrow('FEMA shelter request timed out');
  });
});
