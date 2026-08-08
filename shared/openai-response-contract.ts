function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function extractStructuredOutput(response: unknown): unknown {
  if (!isRecord(response) || !Array.isArray(response.output)) {
    throw new Error('OpenAI response has no output_text');
  }

  for (const item of response.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (content.type === 'refusal') throw new Error('OpenAI response contains a refusal');
      if (content.type === 'output_text' && typeof content.text === 'string') {
        try {
          return JSON.parse(content.text) as unknown;
        } catch {
          throw new Error('OpenAI output_text is not valid JSON');
        }
      }
    }
  }
  throw new Error('OpenAI response has no output_text');
}
