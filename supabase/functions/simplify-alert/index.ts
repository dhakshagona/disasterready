import { extractStructuredOutput } from '../../../shared/openai-response-contract.ts';
import {
  isSafetyPreserving,
  parsePlainLanguageInput,
  parsePlainLanguageOutput,
} from '../../../shared/plain-language-contract.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fallback(reason: string): Response {
  return json({ status: 'fallback', reason });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expectedKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!expectedKey) return json({ error: 'Function authentication is not configured' }, 503);
  if (request.headers.get('apikey') !== expectedKey) return json({ error: 'Unauthorized' }, 401);

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) return json({ error: 'Request is too large' }, 413);

  let input;
  try {
    input = parsePlainLanguageInput(await request.json() as unknown);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request' }, 400);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return fallback('not-configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_500);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.6-luna',
        reasoning: { effort: 'low' },
        max_output_tokens: 300,
        input: [
          {
            role: 'developer',
            content: [{
              type: 'input_text',
              text: 'Rewrite only the official alert wording in clear plain language. Preserve every instruction, prohibition, urgency word, and number. Do not add advice, actions, locations, times, or claims. Do not remove safety information. The deterministic summary is context only.',
            }],
          },
          {
            role: 'user',
            content: [{
              type: 'input_text',
              text: `Hazard: ${input.hazard}\nDeterministic summary: ${input.deterministicSummary}\nOfficial alert text:\n${input.officialText}`,
            }],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'plain_language_alert',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: { plainSummary: { type: 'string', minLength: 30, maxLength: 500 } },
              required: ['plainSummary'],
            },
          },
        },
      }),
    });
    if (!response.ok) return fallback('provider-error');

    let output;
    try {
      const responseBody = await response.json() as unknown;
      output = parsePlainLanguageOutput(extractStructuredOutput(responseBody));
    } catch {
      return fallback('schema-invalid');
    }
    if (!isSafetyPreserving(input.officialText, output.plainSummary)) return fallback('safety-invalid');
    return json({ status: 'ok', output });
  } catch (error) {
    return fallback(error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'provider-error');
  } finally {
    clearTimeout(timeout);
  }
});
