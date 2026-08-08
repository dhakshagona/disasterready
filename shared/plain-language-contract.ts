export const supportedHazards = [
  'flood',
  'tornado',
  'hurricane',
  'wildfire',
  'air-quality',
  'winter-storm',
  'earthquake',
  'other',
] as const;

export type PlainLanguageContractInput = {
  hazard: (typeof supportedHazards)[number];
  officialText: string;
  deterministicSummary: string;
};

const criticalPhrases = [
  '911',
  'do not',
  'never',
  'immediately',
  'evacuate',
  'evacuation',
  'emergency services',
  'higher ground',
  'shelter in place',
  'stay indoors',
];
const directiveTerms = ['avoid', 'call', 'drive', 'evacuate', 'leave', 'move', 'shelter', 'stay'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBoundedText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`Invalid plain-language ${field}`);
  }
  return value.trim();
}

export function parsePlainLanguageInput(value: unknown): PlainLanguageContractInput {
  if (!isRecord(value)) throw new Error('Invalid plain-language input');
  if (!supportedHazards.includes(value.hazard as PlainLanguageContractInput['hazard'])) {
    throw new Error('Invalid plain-language hazard');
  }
  return {
    hazard: value.hazard as PlainLanguageContractInput['hazard'],
    officialText: parseBoundedText(value.officialText, 'officialText', 12_000),
    deterministicSummary: parseBoundedText(value.deterministicSummary, 'deterministicSummary', 500),
  };
}

export function parsePlainLanguageOutput(value: unknown): { plainSummary: string } {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !Object.hasOwn(value, 'plainSummary')) {
    throw new Error('Invalid plain-language output shape');
  }
  const plainSummary = parseBoundedText(value.plainSummary, 'plainSummary', 500);
  if (plainSummary.length < 30) throw new Error('Invalid plain-language plainSummary');
  return { plainSummary };
}

function includesTerm(value: string, term: string): boolean {
  return value.toLowerCase().includes(term);
}

function numericTokens(value: string): string[] {
  return value.match(/\b\d+(?::\d+)?\b/g) ?? [];
}

export function isSafetyPreserving(original: string, simplified: string): boolean {
  const requiredTerms = [...criticalPhrases, ...directiveTerms].filter((term) => includesTerm(original, term));
  if (requiredTerms.some((term) => !includesTerm(simplified, term))) return false;
  if (directiveTerms.some((term) => includesTerm(simplified, term) && !includesTerm(original, term))) return false;

  const originalNumbers = numericTokens(original).sort();
  const simplifiedNumbers = numericTokens(simplified).sort();
  return originalNumbers.length === simplifiedNumbers.length
    && originalNumbers.every((token, index) => token === simplifiedNumbers[index]);
}
