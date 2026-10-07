import { validateShelterSearch, type ShelterSearchPoint } from '@/infrastructure/fema/client';
import type { FemaShelterClientPort } from '@/infrastructure/fema/shelter-source';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type SupabaseShelterProxyClientOptions = {
  projectUrl: string;
  publishableKey: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
};

export class SupabaseShelterProxyClient implements FemaShelterClientPort {
  private readonly endpoint: string;
  private readonly publishableKey: string;
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;

  constructor({ projectUrl, publishableKey, fetcher = fetch, timeoutMs = 12_000 }: SupabaseShelterProxyClientOptions) {
    this.endpoint = `${projectUrl.replace(/\/+$/, '')}/functions/v1/shelter-proxy`;
    this.publishableKey = publishableKey;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async fetchNearby(point: ShelterSearchPoint, radiusMiles: number): Promise<unknown> {
    validateShelterSearch(point, radiusMiles);
    if (radiusMiles > 100) throw new Error('Invalid shelter proxy search radius');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...point, radiusMiles }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Shelter proxy request failed with status ${response.status}`);
      return response.json() as Promise<unknown>;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Shelter proxy request timed out');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class FallbackFemaShelterClient implements FemaShelterClientPort {
  constructor(
    private readonly primary: FemaShelterClientPort,
    private readonly fallback: FemaShelterClientPort,
  ) {}

  async fetchNearby(point: ShelterSearchPoint, radiusMiles: number): Promise<unknown> {
    try {
      return await this.primary.fetchNearby(point, radiusMiles);
    } catch {
      return this.fallback.fetchNearby(point, radiusMiles);
    }
  }
}
