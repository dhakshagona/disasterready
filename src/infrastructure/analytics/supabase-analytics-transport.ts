import type { AnalyticsEvent, AnalyticsTransport } from '@/application/analytics/analytics-service';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type SupabaseAnalyticsTransportOptions = {
  projectUrl: string;
  publishableKey: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
};

export class SupabaseAnalyticsTransport implements AnalyticsTransport {
  private readonly endpoint: string;
  private readonly publishableKey: string;
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;

  constructor({ projectUrl, publishableKey, fetcher = fetch, timeoutMs = 5_000 }: SupabaseAnalyticsTransportOptions) {
    this.endpoint = `${projectUrl.replace(/\/+$/, '')}/functions/v1/record-events`;
    this.publishableKey = publishableKey;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async send(events: AnalyticsEvent[]): Promise<void> {
    if (events.length > 25) throw new Error('Analytics batch exceeds 25 events');
    if (!events.length) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          Authorization: `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Analytics delivery failed with status ${response.status}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
