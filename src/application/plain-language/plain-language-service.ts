import type { Alert, HazardType } from '@/domain/models';
import { isSafetyPreserving, parsePlainLanguageOutput } from '../../../shared/plain-language-contract';

export type PlainLanguageInput = {
  hazard: HazardType;
  officialText: string;
  deterministicSummary: string;
};

export interface PlainLanguageProvider {
  simplify(input: PlainLanguageInput): Promise<unknown>;
}

export type PlainLanguageFallbackReason =
  | 'not-configured'
  | 'unsupported'
  | 'timeout'
  | 'provider-error'
  | 'rate-limited'
  | 'schema-invalid'
  | 'safety-invalid';

export type PlainLanguageResult =
  | { summary: string; source: 'ai' }
  | { summary: string; source: 'deterministic'; reason: PlainLanguageFallbackReason };

export class PlainLanguageUnavailableError extends Error {
  override readonly name = 'PlainLanguageUnavailableError';

  constructor(readonly reason: PlainLanguageFallbackReason) {
    super(`Plain-language provider unavailable: ${reason}`);
  }
}

type PlainLanguageServiceOptions = {
  provider?: PlainLanguageProvider;
};

export class PlainLanguageService {
  private readonly provider?: PlainLanguageProvider;

  constructor({ provider }: PlainLanguageServiceOptions = {}) {
    this.provider = provider;
  }

  async simplify(alert: Alert): Promise<PlainLanguageResult> {
    const officialSourceText = alert.instructionText?.trim() || alert.originalText.trim();
    if (alert.isDemo || !officialSourceText) {
      return { summary: alert.summary, source: 'deterministic', reason: 'unsupported' };
    }
    if (!this.provider) {
      return { summary: alert.summary, source: 'deterministic', reason: 'not-configured' };
    }

    let output: unknown;
    try {
      output = await this.provider.simplify({
        hazard: alert.hazard,
        officialText: officialSourceText,
        deterministicSummary: alert.summary,
      });
    } catch (error) {
      const reason = error instanceof PlainLanguageUnavailableError
        ? error.reason
        : error instanceof Error && error.name === 'AbortError'
          ? 'timeout'
          : 'provider-error';
      return { summary: alert.summary, source: 'deterministic', reason };
    }

    let parsedOutput: { plainSummary: string };
    try {
      parsedOutput = parsePlainLanguageOutput(output);
    } catch {
      return { summary: alert.summary, source: 'deterministic', reason: 'schema-invalid' };
    }
    const summary = parsedOutput.plainSummary;
    if (!isSafetyPreserving(officialSourceText, summary)) {
      return { summary: alert.summary, source: 'deterministic', reason: 'safety-invalid' };
    }
    return { summary, source: 'ai' };
  }
}
