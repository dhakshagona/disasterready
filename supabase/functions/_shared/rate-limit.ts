type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

import { secretKeyHeaders } from './supabase-keys.ts';

export type RateLimitCheck = {
  scope: string;
  limit: number;
  windowSeconds: number;
  cost?: number;
  identity?: 'client' | 'global';
};

type RateLimitsOptions = {
  request: Request;
  projectUrl: string;
  secretKey: string;
  salt: string;
  checks: RateLimitCheck[];
  fetcher?: FetchLike;
};

function clientIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const address = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? forwarded
    ?? null;
  if (address) return `ip:${address}`;
  return 'unattributed';
}

export async function hashRateLimitIdentity(request: Request, salt: string, identity: 'client' | 'global' = 'client'): Promise<string> {
  const value = identity === 'global' ? 'global' : clientIdentity(request);
  const bytes = new TextEncoder().encode(`${salt}\n${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function consumeRateLimits({
  request,
  projectUrl,
  secretKey,
  salt,
  checks,
  fetcher = fetch,
}: RateLimitsOptions): Promise<'allowed' | 'limited' | 'unavailable'> {
  const preparedChecks = await Promise.all(checks.map(async ({ scope, limit, windowSeconds, cost = 1, identity = 'client' }) => ({
    scope,
    key_hash: await hashRateLimitIdentity(request, salt, identity),
    limit,
    window_seconds: windowSeconds,
    cost,
  })));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);
  try {
    const response = await fetcher(`${projectUrl.replace(/\/+$/, '')}/rest/v1/rpc/consume_edge_rate_limits`, {
      method: 'POST',
      headers: {
        ...secretKeyHeaders(secretKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_checks: preparedChecks }),
      signal: controller.signal,
    });
    if (!response.ok) return 'unavailable';
    return await response.json() === true ? 'allowed' : 'limited';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}

export async function consumeRateLimit(options: Omit<RateLimitsOptions, 'checks'> & RateLimitCheck) {
  const { scope, limit, windowSeconds, cost, identity, ...shared } = options;
  return consumeRateLimits({ ...shared, checks: [{ scope, limit, windowSeconds, cost, identity }] });
}
