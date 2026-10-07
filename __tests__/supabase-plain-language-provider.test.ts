import { describe, expect, it, jest } from '@jest/globals';

import { PlainLanguageUnavailableError, type PlainLanguageInput } from '@/application/plain-language/plain-language-service';
import { SupabasePlainLanguageProvider } from '@/infrastructure/plain-language/supabase-plain-language-provider';

const input: PlainLanguageInput = {
  hazard: 'flood',
  officialText: 'Move to higher ground immediately. Do not drive through floodwater.',
  deterministicSummary: 'A flood warning is active.',
};

describe('Supabase plain-language provider', () => {
  it('calls the server-side simplifier without exposing a model-provider credential', async () => {
    const fetcher = jest.fn(async () => new Response(JSON.stringify({
      status: 'ok',
      output: { plainSummary: 'Move to higher ground immediately. Do not drive through floodwater.' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const provider = new SupabasePlainLanguageProvider({
      projectUrl: 'https://project.supabase.co/',
      publishableKey: 'publishable-test-key',
      fetcher,
    });

    await expect(provider.simplify(input)).resolves.toEqual({
      plainSummary: 'Move to higher ground immediately. Do not drive through floodwater.',
    });
    expect(fetcher).toHaveBeenCalledWith('https://project.supabase.co/functions/v1/simplify-alert', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ apikey: 'publishable-test-key' }),
      body: JSON.stringify(input),
    }));
  });

  it('maps the server no-key fallback to an explicit unavailable error', async () => {
    const provider = new SupabasePlainLanguageProvider({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(JSON.stringify({ status: 'fallback', reason: 'not-configured' }), { status: 200 }),
    });

    await expect(provider.simplify(input)).rejects.toEqual(expect.objectContaining({
      name: 'PlainLanguageUnavailableError',
      reason: 'not-configured',
    }));
  });

  it('preserves validated server fallback reasons for truthful analytics', async () => {
    const provider = new SupabasePlainLanguageProvider({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(JSON.stringify({ status: 'fallback', reason: 'safety-invalid' }), { status: 200 }),
    });

    await expect(provider.simplify(input)).rejects.toEqual(expect.objectContaining({
      name: 'PlainLanguageUnavailableError',
      reason: 'safety-invalid',
    }));
  });

  it('surfaces HTTP failure for deterministic fallback handling', async () => {
    const provider = new SupabasePlainLanguageProvider({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'publishable-test-key',
      fetcher: async () => new Response(null, { status: 503 }),
    });

    await expect(provider.simplify(input)).rejects.toThrow('Plain-language request failed with status 503');
  });

  it('uses only the public apikey for modern Supabase publishable keys', async () => {
    const fetcher = jest.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ status: 'fallback', reason: 'rate-limited' }), { status: 200 }));
    const provider = new SupabasePlainLanguageProvider({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      fetcher,
    });

    await expect(provider.simplify(input)).rejects.toEqual(expect.objectContaining({ reason: 'rate-limited' }));
    const options = fetcher.mock.calls[0]?.[1];
    expect(options?.headers).not.toHaveProperty('Authorization');
  });
});
