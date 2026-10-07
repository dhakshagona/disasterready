import {
  PlainLanguageUnavailableError,
  type PlainLanguageFallbackReason,
  type PlainLanguageInput,
  type PlainLanguageProvider,
} from '@/application/plain-language/plain-language-service';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type SupabasePlainLanguageProviderOptions = {
  projectUrl: string;
  publishableKey: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
};

type ProviderResponse = {
  status?: unknown;
  reason?: unknown;
  output?: unknown;
};

const fallbackReasons: PlainLanguageFallbackReason[] = [
  'not-configured',
  'unsupported',
  'timeout',
  'provider-error',
  'rate-limited',
  'schema-invalid',
  'safety-invalid',
];

function isFallbackReason(value: unknown): value is PlainLanguageFallbackReason {
  return typeof value === 'string' && fallbackReasons.includes(value as PlainLanguageFallbackReason);
}

export class SupabasePlainLanguageProvider implements PlainLanguageProvider {
  private readonly endpoint: string;
  private readonly publishableKey: string;
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;

  constructor({ projectUrl, publishableKey, fetcher = fetch, timeoutMs = 9_000 }: SupabasePlainLanguageProviderOptions) {
    this.endpoint = `${projectUrl.replace(/\/+$/, '')}/functions/v1/simplify-alert`;
    this.publishableKey = publishableKey;
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async simplify(input: PlainLanguageInput): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Plain-language request failed with status ${response.status}`);
      const payload = await response.json() as ProviderResponse;
      if (payload.status === 'fallback') {
        throw new PlainLanguageUnavailableError(isFallbackReason(payload.reason) ? payload.reason : 'provider-error');
      }
      if (payload.status !== 'ok') throw new Error('Plain-language provider returned an invalid response');
      return payload.output;
    } finally {
      clearTimeout(timeout);
    }
  }
}
