function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function extractGeminiStructuredOutput(response: unknown): unknown {
  if (!isRecord(response) || !Array.isArray(response.candidates) || response.candidates.length !== 1) {
    throw new Error('Gemini response has no single candidate');
  }

  const candidate = response.candidates[0];
  if (!isRecord(candidate) || candidate.finishReason !== 'STOP' || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    throw new Error('Gemini response candidate did not finish safely');
  }

  const text = candidate.content.parts
    .filter(isRecord)
    .map((part) => part.text)
    .filter((part): part is string => typeof part === 'string')
    .join('');
  if (!text) throw new Error('Gemini response has no text');

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Gemini response text is not valid JSON');
  }
}
