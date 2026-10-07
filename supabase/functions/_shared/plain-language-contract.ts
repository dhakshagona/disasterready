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
  'dangerous',
  'do not',
  'emergency',
  'never',
  'immediately',
  'life threatening',
  'mandatory',
  'not',
  'severe',
  'until',
  'warning',
  'evacuate',
  'evacuation',
  'emergency services',
  'higher ground',
  'shelter in place',
  'stay indoors',
];
const directiveTerms = [
  'avoid',
  'call',
  'drive',
  'enter',
  'evacuate',
  'go',
  'leave',
  'move',
  'remain',
  'return',
  'seek',
  'shelter',
  'stay',
  'turn around',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBoundedText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`Invalid plain-language ${field}`);
  }
  return value.trim();
}

const negativeContractions: Array<[RegExp, string]> = [
  [/\bdon[’']t\b/g, 'do not'],
  [/\bdoesn[’']t\b/g, 'does not'],
  [/\bdidn[’']t\b/g, 'did not'],
  [/\bcan[’']t\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bwon[’']t\b/g, 'will not'],
  [/\bisn[’']t\b/g, 'is not'],
  [/\baren[’']t\b/g, 'are not'],
  [/\bwasn[’']t\b/g, 'was not'],
  [/\bweren[’']t\b/g, 'were not'],
  [/\bhasn[’']t\b/g, 'has not'],
  [/\bhaven[’']t\b/g, 'have not'],
  [/\bhadn[’']t\b/g, 'had not'],
  [/\bshouldn[’']t\b/g, 'should not'],
  [/\bwouldn[’']t\b/g, 'would not'],
  [/\bcouldn[’']t\b/g, 'could not'],
  [/\bmustn[’']t\b/g, 'must not'],
  [/\bneedn[’']t\b/g, 'need not'],
  [/\bmightn[’']t\b/g, 'might not'],
];

export function parsePlainLanguageInput(value: unknown): PlainLanguageContractInput {
  if (!isRecord(value)) throw new Error('Invalid plain-language input');
  const keys = Object.keys(value).sort();
  if (keys.join(',') !== 'deterministicSummary,hazard,officialText') throw new Error('Invalid plain-language input shape');
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

function normalizedWords(value: string): string {
  const expanded = negativeContractions.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value
    .normalize('NFKC')
    .toLowerCase(),
  );

  return expanded
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesTerm(value: string, term: string): boolean {
  return ` ${normalizedWords(value)} `.includes(` ${normalizedWords(term)} `);
}

function safetyFacts(value: string): string[] {
  const matches = value.toLowerCase().matchAll(/\b\d+(?:,\d{3})*(?:\.\d+)?(?::\d{2})?\s*(?:%|percent|mph|miles?|mi|feet|foot|ft|inches?|in|hours?|hrs?|minutes?|mins?|seconds?|secs?|am|pm)?(?=$|[^a-z0-9])/g);
  return Array.from(matches, (match) => match[0].replace(/,/g, '').replace(/\s+/g, ' ').trim());
}

function isNegatedDirective(clause: string, term: string): boolean {
  const words = normalizedWords(clause);
  const normalizedTerm = normalizedWords(term).replace(/\s+/g, '\\s+');
  return new RegExp(`\\b(?:do\\s+not|never|not)\\s+(?:[a-z0-9]+\\s+){0,3}${normalizedTerm}\\b`).test(words);
}

function safetyClauseSignatures(value: string): string[] {
  const safetyTerms = [...new Set([...criticalPhrases, ...directiveTerms])];
  return value
    .split(/[,.!?;\n]+/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause) => {
      const terms = safetyTerms
        .filter((term) => includesTerm(clause, term))
        .map((term) => directiveTerms.includes(term)
          ? `${term}:${isNegatedDirective(clause, term) ? 'negated' : 'affirmative'}`
          : term)
        .sort();
      const facts = safetyFacts(clause);
      return terms.length || facts.length ? `${terms.join('|')}=>${facts.join('|')}` : null;
    })
    .filter((signature): signature is string => signature !== null)
    .sort();
}

export function isSafetyPreserving(original: string, simplified: string): boolean {
  const safetyTerms = [...new Set([...criticalPhrases, ...directiveTerms])];
  const requiredTerms = safetyTerms.filter((term) => includesTerm(original, term));
  if (requiredTerms.some((term) => !includesTerm(simplified, term))) return false;
  if (safetyTerms.some((term) => includesTerm(simplified, term) && !includesTerm(original, term))) return false;

  const originalSignatures = safetyClauseSignatures(original);
  const simplifiedSignatures = safetyClauseSignatures(simplified);
  return originalSignatures.length === simplifiedSignatures.length
    && originalSignatures.every((signature, index) => signature === simplifiedSignatures[index]);
}
