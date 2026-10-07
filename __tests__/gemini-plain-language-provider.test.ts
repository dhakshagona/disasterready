import { describe, expect, it, jest } from '@jest/globals';

import {
  GeminiPlainLanguageProvider,
  geminiFreeTierModel,
} from '../supabase/functions/_shared/gemini-plain-language-provider';

const input = {
  hazard: 'flood' as const,
  deterministicSummary: 'A flood warning is active.',
  officialText: 'Move to higher ground immediately. Do not drive through floodwater.',
};

function geminiResponse(plainSummary: string) {
  return new Response(JSON.stringify({
    candidates: [{
      finishReason: 'STOP',
      content: { parts: [{ text: JSON.stringify({ plainSummary }) }] },
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('Gemini plain-language provider', () => {
  it('uses the fixed free-tier model, server key header, and strict JSON output', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => geminiResponse('Move to higher ground immediately. Do not drive through floodwater.'),
    );
    const provider = new GeminiPlainLanguageProvider('gemini-test-key', fetcher);

    await expect(provider.simplify(input, new AbortController().signal)).resolves.toEqual({
      plainSummary: 'Move to higher ground immediately. Do not drive through floodwater.',
    });

    const [url, request] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${geminiFreeTierModel}:generateContent`);
    expect(url).not.toContain('gemini-test-key');
    expect(request?.headers).toEqual(expect.objectContaining({ 'x-goog-api-key': 'gemini-test-key' }));
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('tools');
    expect(body).not.toHaveProperty('generationConfig.candidateCount');
    expect(body).toHaveProperty('generationConfig.responseMimeType', 'application/json');
    expect(body).toHaveProperty('generationConfig.responseJsonSchema.additionalProperties', false);
  });

  it('maps free-tier quota exhaustion and invalid provider output to deterministic fallback reasons', async () => {
    const limited = new GeminiPlainLanguageProvider('gemini-test-key', async () => new Response(null, { status: 429 }));
    const invalid = new GeminiPlainLanguageProvider('gemini-test-key', async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));

    await expect(limited.simplify(input, new AbortController().signal)).rejects.toMatchObject({ reason: 'rate-limited' });
    await expect(invalid.simplify(input, new AbortController().signal)).rejects.toMatchObject({ reason: 'schema-invalid' });
  });
});
