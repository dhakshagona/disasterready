import { describe, expect, it } from '@jest/globals';

import { extractStructuredOutput } from '../shared/openai-response-contract';

describe('OpenAI Responses API contract', () => {
  it('finds and parses structured output text without assuming array positions', () => {
    expect(extractStructuredOutput({
      output: [
        { type: 'reasoning', content: [] },
        { type: 'message', content: [{ type: 'output_text', text: '{"plainSummary":"Move to higher ground immediately."}' }] },
      ],
    })).toEqual({ plainSummary: 'Move to higher ground immediately.' });
  });

  it('rejects refusals, missing output, and invalid JSON', () => {
    expect(() => extractStructuredOutput({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] })).toThrow('refusal');
    expect(() => extractStructuredOutput({ output: [] })).toThrow('output_text');
    expect(() => extractStructuredOutput({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'not-json' }] }] })).toThrow('JSON');
  });
});
