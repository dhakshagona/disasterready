import { corsHeaders, inputError, json, readBoundedJson, readBoundedText } from '../_shared/http.ts';
import { consumeRateLimits } from '../_shared/rate-limit.ts';
import { parseShelterProxyInput } from '../_shared/shelter-contract.ts';
import { getDatabaseSecretKey, getPublishableKeys, hasValidPublishableKey } from '../_shared/supabase-keys.ts';

const layerUrl = 'https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0/query';
const outFields = [
  'shelter_id', 'shelter_name', 'address_1', 'city', 'state', 'zip',
  'shelter_status_code', 'evacuation_capacity', 'ada_compliant',
  'wheelchair_accessible', 'pet_accommodations_desc',
  'org_organization_name', 'org_main_phone', 'shelter_open_date',
  'reporting_period', 'latitude', 'longitude', 'geox', 'geoy',
].join(',');
const readEnvironment = (name: string) => Deno.env.get(name);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!getPublishableKeys(readEnvironment).length) return json({ error: 'Function authentication is not configured' }, 503);
  if (!hasValidPublishableKey(request, readEnvironment)) return json({ error: 'Unauthorized' }, 401);

  let input;
  try {
    input = parseShelterProxyInput(await readBoundedJson(request, 2_048));
  } catch (error) {
    return inputError(error);
  }

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const secretKey = getDatabaseSecretKey(readEnvironment);
  const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT');
  if (!projectUrl || !secretKey || !rateLimitSalt) return json({ error: 'Rate limiting is not configured' }, 503);
  const rateLimit = await consumeRateLimits({
    request,
    projectUrl,
    secretKey,
    salt: rateLimitSalt,
    checks: [
      { scope: 'shelter-proxy', limit: 12, windowSeconds: 60 },
      { scope: 'shelter-proxy-client-daily', limit: 300, windowSeconds: 86_400 },
      { scope: 'shelter-proxy-global', limit: 60, windowSeconds: 60, identity: 'global' },
      { scope: 'shelter-proxy-daily', limit: 5_000, windowSeconds: 86_400, identity: 'global' },
    ],
  });
  if (rateLimit === 'limited') return json({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  if (rateLimit === 'unavailable') return json({ error: 'Rate limit check failed' }, 503);

  const query = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields,
    returnGeometry: 'true',
    geometry: `${input.longitude},${input.latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(input.radiusMiles),
    units: 'esriSRUnit_StatuteMile',
    outSR: '4326',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(layerUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: query.toString(),
      signal: controller.signal,
    });
    if (!response.ok) return json({ error: 'FEMA shelter source failed' }, 502);
    const responseText = await readBoundedText(response.body, 1_000_000);
    let payload;
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      return json({ error: 'FEMA shelter response is invalid' }, 502);
    }
    return json(payload);
  } catch {
    return json({ error: 'FEMA shelter source timed out or failed' }, 502);
  } finally {
    clearTimeout(timeout);
  }
});
