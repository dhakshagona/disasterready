import { parseAnalyticsBatch } from '../_shared/analytics-contract.ts';
import { corsHeaders, inputError, json, readBoundedJson } from '../_shared/http.ts';
import { consumeRateLimits } from '../_shared/rate-limit.ts';
import { getDatabaseSecretKey, getPublishableKeys, hasValidPublishableKey, secretKeyHeaders } from '../_shared/supabase-keys.ts';

const readEnvironment = (name: string) => Deno.env.get(name);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!getPublishableKeys(readEnvironment).length) return json({ error: 'Function authentication is not configured' }, 503);
  if (!hasValidPublishableKey(request, readEnvironment)) return json({ error: 'Unauthorized' }, 401);

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const secretKey = getDatabaseSecretKey(readEnvironment);
  const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT');
  if (!projectUrl || !secretKey || !rateLimitSalt) return json({ error: 'Function storage or rate limiting is not configured' }, 503);

  let events;
  try {
    events = parseAnalyticsBatch(await readBoundedJson(request, 65_536), new Date());
  } catch (error) {
    return inputError(error);
  }

  const rateLimit = await consumeRateLimits({
    request,
    projectUrl,
    secretKey,
    salt: rateLimitSalt,
    checks: [
      { scope: 'record-events', limit: 10, windowSeconds: 60 },
      { scope: 'record-events-client-daily', limit: 1_000, windowSeconds: 86_400, cost: events.length },
      { scope: 'record-events-global', limit: 60, windowSeconds: 60, identity: 'global' },
      { scope: 'record-events-daily', limit: 25_000, windowSeconds: 86_400, cost: events.length, identity: 'global' },
    ],
  });
  if (rateLimit === 'limited') return json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  if (rateLimit === 'unavailable') return json({ error: 'Rate limit check failed' }, 503);

  const rows = events.map((event) => ({
    id: event.id,
    session_id: event.sessionId,
    name: event.name,
    occurred_at: event.occurredAt,
    mode: event.mode,
    properties: event.properties,
  }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(`${projectUrl}/rest/v1/rpc/ingest_analytics_events`, {
      method: 'POST',
      headers: {
        ...secretKeyHeaders(secretKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_events: rows }),
      signal: controller.signal,
    });
    if (!response.ok) return json({ error: 'Analytics storage failed' }, 502);
    return json({ processed: events.length }, 202);
  } catch {
    return json({ error: 'Analytics storage timed out or failed' }, 502);
  } finally {
    clearTimeout(timeout);
  }
});
