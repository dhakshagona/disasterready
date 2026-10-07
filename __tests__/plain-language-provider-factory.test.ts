import { describe, expect, it } from '@jest/globals';

import { GeminiPlainLanguageProvider } from '../supabase/functions/_shared/gemini-plain-language-provider';
import { createPlainLanguageModelProvider } from '../supabase/functions/_shared/plain-language-provider-factory';

describe('plain-language provider factory', () => {
  it('keeps provider configuration outside the Edge Function handler', () => {
    expect(createPlainLanguageModelProvider(() => undefined)).toBeNull();
    expect(createPlainLanguageModelProvider((name) => name === 'GEMINI_API_KEY' ? 'gemini-test-key' : undefined)).toBeInstanceOf(GeminiPlainLanguageProvider);
  });
});
