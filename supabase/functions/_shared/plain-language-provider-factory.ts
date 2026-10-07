import { GeminiPlainLanguageProvider } from './gemini-plain-language-provider.ts';
import type { PlainLanguageModelProvider } from './plain-language-provider.ts';

type ReadEnvironment = (name: string) => string | undefined;

export function createPlainLanguageModelProvider(readEnvironment: ReadEnvironment): PlainLanguageModelProvider | null {
  const apiKey = readEnvironment('GEMINI_API_KEY');
  return apiKey ? new GeminiPlainLanguageProvider(apiKey) : null;
}
