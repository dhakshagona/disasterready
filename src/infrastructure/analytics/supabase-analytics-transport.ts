import {
  AnalyticsTransportError,
  type AnalyticsEvent,
  type AnalyticsTransport,
} from '@/application/analytics/analytics-service';
import { parseAnalyticsBatch } from '../../../shared/analytics-contract';

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

  constructor({ projectUrl, publishableKey, fetcher = fetch, timeoutMs = 8_000 }: SupabaseAnalyticsTransportOptions) {
    this.endpoint = `${projectUrl.replace(/\/+$/, '')}/functions/v1/record-events`;
    this.publishableKey = publishableKey;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async send(events: AnalyticsEvent[]): Promise<void> {
    if (events.length > 25) throw new Error('Analytics batch exceeds 25 events');
    if (!events.length) return;
    parseAnalyticsBatch({ events }, new Date());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const retryable = ![400, 413, 422].includes(response.status);
        throw new AnalyticsTransportError(`Analytics delivery failed with status ${response.status}`, response.status, retryable);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
