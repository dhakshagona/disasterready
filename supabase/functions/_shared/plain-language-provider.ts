import type { PlainLanguageContractInput } from './plain-language-contract.ts';

export type PlainLanguageProviderFailureReason = 'provider-error' | 'rate-limited' | 'schema-invalid';

export class PlainLanguageProviderError extends Error {
  constructor(readonly reason: PlainLanguageProviderFailureReason) {
    super(reason);
    this.name = 'PlainLanguageProviderError';
  }
}

export interface PlainLanguageModelProvider {
  simplify(input: PlainLanguageContractInput, signal: AbortSignal): Promise<unknown>;
}
