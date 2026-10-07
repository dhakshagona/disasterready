import { describe, expect, it } from '@jest/globals';

import { extractGeminiStructuredOutput } from '../shared/gemini-response-contract';

describe('Gemini structured response contract', () => {
  it('parses the single safely completed JSON candidate', () => {
    expect(extractGeminiStructuredOutput({
      candidates: [{
        finishReason: 'STOP',
        content: { parts: [{ text: '{"plainSummary":"Move to higher ground immediately."}' }] },
      }],
    })).toEqual({ plainSummary: 'Move to higher ground immediately.' });
  });

  it('rejects blocked, multiple, missing, and malformed outputs', () => {
    expect(() => extractGeminiStructuredOutput({ candidates: [] })).toThrow('candidate');
    expect(() => extractGeminiStructuredOutput({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] })).toThrow('safely');
    expect(() => extractGeminiStructuredOutput({ candidates: [
      { finishReason: 'STOP', content: { parts: [{ text: '{}' }] } },
      { finishReason: 'STOP', content: { parts: [{ text: '{}' }] } },
    ] })).toThrow('single');
    expect(() => extractGeminiStructuredOutput({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'not-json' }] } }],
    })).toThrow('JSON');
  });
});
