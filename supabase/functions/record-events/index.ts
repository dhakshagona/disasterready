import { parseAnalyticsBatch } from '../_shared/analytics-contract.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expectedKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!expectedKey) return json({ error: 'Function authentication is not configured' }, 503);
  if (request.headers.get('apikey') !== expectedKey) return json({ error: 'Unauthorized' }, 401);

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 65_536) return json({ error: 'Request is too large' }, 413);

  let events;
  try {
    const body = await request.json() as unknown;
    events = parseAnalyticsBatch(body);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request' }, 400);
  }

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!projectUrl || !serviceRoleKey) return json({ error: 'Database connection is not configured' }, 503);

  const rows = events.map((event) => ({
    id: event.id,
    session_id: event.sessionId,
    name: event.name,
    occurred_at: event.occurredAt,
    mode: event.mode,
    properties: event.properties,
  }));
  const response = await fetch(`${projectUrl}/rest/v1/analytics_events?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) return json({ error: 'Analytics storage failed' }, 502);
  return json({ accepted: events.length }, 202);
});
