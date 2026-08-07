export type GeoPoint = { latitude: number; longitude: number };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type NwsAlertClientOptions = {
  fetcher?: FetchLike;
  platform: 'native' | 'web';
  timeoutMs?: number;
};

const baseUrl = 'https://api.weather.gov';

function validatePoint(point: GeoPoint) {
  if (
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    point.latitude < -90 ||
    point.latitude > 90 ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    throw new Error('Invalid alert lookup coordinates');
  }
}

export class NwsAlertClient {
  private readonly fetcher: FetchLike;
  private readonly platform: 'native' | 'web';
  private readonly timeoutMs: number;

  constructor({ fetcher = fetch, platform, timeoutMs = 10_000 }: NwsAlertClientOptions) {
    this.fetcher = fetcher;
    this.platform = platform;
    this.timeoutMs = timeoutMs;
  }

  async fetchActiveForPoint(point: GeoPoint): Promise<unknown> {
    validatePoint(point);
    const query = new URLSearchParams({ point: `${point.latitude},${point.longitude}` });
    const headers: Record<string, string> = {
      Accept: 'application/geo+json',
    };
    if (this.platform === 'native') {
      headers['User-Agent'] = 'DisasterReady/1.0 (public GitHub educational project)';
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${baseUrl}/alerts/active?${query.toString()}`, { headers, signal: controller.signal });
      if (!response.ok) throw new Error(`NWS request failed with status ${response.status}`);
      return response.json() as Promise<unknown>;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('NWS request timed out');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
