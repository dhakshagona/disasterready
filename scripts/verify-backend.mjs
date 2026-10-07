import { randomUUID } from 'node:crypto';

const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const includeAi = process.argv.includes('--include-ai');

if (!projectUrl || !publishableKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY before running backend verification.');
  process.exit(1);
}

const functionHeaders = {
  apikey: publishableKey,
  'Content-Type': 'application/json',
};

async function request(path, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(`${projectUrl}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requireStatus(response, statuses, label) {
  if (statuses.includes(response.status)) return;
  const body = await response.text();
  throw new Error(`${label} failed with status ${response.status}: ${body.slice(0, 300)}`);
}

async function requireDenied(path, init, label) {
  const response = await request(path, init);
  if ([401, 403].includes(response.status)) return;
  const body = await response.text();
  throw new Error(`${label} must return 401 or 403, received ${response.status}: ${body.slice(0, 300)}`);
}

await requireDenied('/rest/v1/analytics_events?select=id&limit=1', {
  headers: { apikey: publishableKey },
}, 'Direct analytics select');
await requireDenied(`/rest/v1/analytics_events?id=eq.${randomUUID()}`, {
  method: 'PATCH',
  headers: functionHeaders,
  body: JSON.stringify({ mode: 'demo' }),
}, 'Direct analytics update');
await requireDenied(`/rest/v1/analytics_events?id=eq.${randomUUID()}`, {
  method: 'DELETE',
  headers: { apikey: publishableKey },
}, 'Direct analytics delete');
await requireDenied('/rest/v1/analytics_events', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({
    id: randomUUID(),
    session_id: randomUUID(),
    name: 'session_started',
    occurred_at: new Date().toISOString(),
    mode: 'real',
    properties: {},
  }),
}, 'Direct analytics insert');
await requireDenied('/rest/v1/analytics_daily_counts?select=*&limit=1', {
  headers: { apikey: publishableKey },
}, 'Direct analytics report access');
await requireDenied('/rest/v1/rpc/consume_edge_rate_limits', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({ p_checks: [{ scope: 'verification', key_hash: '0'.repeat(64), limit: 1, window_seconds: 60, cost: 1 }] }),
}, 'Direct rate-limit RPC access');
await requireDenied('/rest/v1/rpc/ingest_analytics_events', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({ p_events: [] }),
}, 'Direct analytics ingestion RPC access');
await requireDenied('/rest/v1/rpc/delete_expired_analytics_events', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({ retain_days: 90, batch_size: 1 }),
}, 'Direct analytics cleanup RPC access');

const shelter = await request('/functions/v1/shelter-proxy', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({ latitude: 30.2672, longitude: -97.7431, radiusMiles: 1 }),
});
await requireStatus(shelter, [200], 'Shelter proxy');
const shelterBody = await shelter.json();
if (typeof shelterBody !== 'object' || shelterBody === null || !Array.isArray(shelterBody.features)) {
  throw new Error('Shelter proxy returned an invalid FEMA payload.');
}

const analytics = await request('/functions/v1/record-events', {
  method: 'POST',
  headers: functionHeaders,
  body: JSON.stringify({
    events: [{
      id: randomUUID(),
      sessionId: randomUUID(),
      name: 'demo_session_started',
      occurredAt: new Date().toISOString(),
      mode: 'demo',
      properties: { hazard: 'flood', entry: 'home' },
    }],
  }),
});
await requireStatus(analytics, [202], 'Analytics ingestion');

if (includeAi) {
  const simplification = await request('/functions/v1/simplify-alert', {
    method: 'POST',
    headers: functionHeaders,
    body: JSON.stringify({
      hazard: 'flood',
      deterministicSummary: 'A flood warning is active.',
      officialText: 'Move to higher ground immediately. Do not drive through floodwater.',
    }),
  });
  await requireStatus(simplification, [200], 'Plain-language function');
  const simplificationBody = await simplification.json();
  if (simplificationBody?.status !== 'ok') throw new Error(`Plain-language production verification requires validated AI output, received ${JSON.stringify(simplificationBody)}.`);
}

console.log(`Backend verification passed${includeAi ? ', including the optional AI path' : ''}.`);
