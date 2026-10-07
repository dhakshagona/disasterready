import {
  isSafetyPreserving,
  parsePlainLanguageInput,
  parsePlainLanguageOutput,
} from '../_shared/plain-language-contract.ts';
import { corsHeaders, inputError, json, readBoundedJson } from '../_shared/http.ts';
import { consumeRateLimits } from '../_shared/rate-limit.ts';
import { PlainLanguageProviderError } from '../_shared/plain-language-provider.ts';
import { createPlainLanguageModelProvider } from '../_shared/plain-language-provider-factory.ts';
import { getDatabaseSecretKey, getPublishableKeys, hasValidPublishableKey } from '../_shared/supabase-keys.ts';

const readEnvironment = (name: string) => Deno.env.get(name);

function fallback(reason: string): Response {
  return json({ status: 'fallback', reason });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!getPublishableKeys(readEnvironment).length) return json({ error: 'Function authentication is not configured' }, 503);
  if (!hasValidPublishableKey(request, readEnvironment)) return json({ error: 'Unauthorized' }, 401);

  let input;
  try {
    input = parsePlainLanguageInput(await readBoundedJson(request, 20_000));
  } catch (error) {
    return inputError(error);
  }

  const provider = createPlainLanguageModelProvider(readEnvironment);
  if (!provider) return fallback('not-configured');

  const projectUrl = Deno.env.get('SUPABASE_URL');
  const secretKey = getDatabaseSecretKey(readEnvironment);
  const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT');
  if (!projectUrl || !secretKey || !rateLimitSalt) return fallback('provider-error');
  const rateLimit = await consumeRateLimits({
    request,
    projectUrl,
    secretKey,
    salt: rateLimitSalt,
    checks: [
      { scope: 'simplify-alert', limit: 4, windowSeconds: 60 },
      { scope: 'simplify-alert-client-daily', limit: 40, windowSeconds: 86_400 },
      { scope: 'simplify-alert-global', limit: 12, windowSeconds: 60, identity: 'global' },
      { scope: 'simplify-alert-daily', limit: 200, windowSeconds: 86_400, identity: 'global' },
    ],
  });
  if (rateLimit === 'limited') return fallback('rate-limited');
  if (rateLimit === 'unavailable') return fallback('provider-error');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const output = parsePlainLanguageOutput(await provider.simplify(input, controller.signal));
    if (!isSafetyPreserving(input.officialText, output.plainSummary)) return fallback('safety-invalid');
    return json({ status: 'ok', output });
  } catch (error) {
    if (error instanceof PlainLanguageProviderError) return fallback(error.reason);
    return fallback(error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'schema-invalid');
  } finally {
    clearTimeout(timeout);
  }
});
