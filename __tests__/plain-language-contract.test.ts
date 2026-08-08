import { describe, expect, it } from '@jest/globals';

import {
  isSafetyPreserving,
  parsePlainLanguageInput,
  parsePlainLanguageOutput,
} from '../shared/plain-language-contract';

describe('plain-language server contract', () => {
  it('accepts only a bounded hazard and official alert text contract', () => {
    expect(parsePlainLanguageInput({
      hazard: 'flood',
      officialText: 'Move to higher ground immediately. Do not drive through floodwater.',
      deterministicSummary: 'A flood warning is active.',
    })).toEqual({
      hazard: 'flood',
      officialText: 'Move to higher ground immediately. Do not drive through floodwater.',
      deterministicSummary: 'A flood warning is active.',
    });
    expect(() => parsePlainLanguageInput({ hazard: 'alien', officialText: 'Valid text', deterministicSummary: 'Valid summary' })).toThrow('hazard');
    expect(() => parsePlainLanguageInput({ hazard: 'flood', officialText: 'x'.repeat(12_001), deterministicSummary: 'Valid summary' })).toThrow('officialText');
  });

  it('requires the exact model output shape and a bounded summary', () => {
    expect(parsePlainLanguageOutput({ plainSummary: 'Move to higher ground immediately.' })).toEqual({ plainSummary: 'Move to higher ground immediately.' });
    expect(() => parsePlainLanguageOutput({ plainSummary: 'Too short' })).toThrow('plainSummary');
    expect(() => parsePlainLanguageOutput({ plainSummary: 'Move to higher ground immediately.', extra: true })).toThrow('shape');
  });

  it('rejects missing critical instructions, changed numbers, and invented directives', () => {
    const original = 'Move to higher ground immediately. Do not drive through water. Call 911.';
    expect(isSafetyPreserving(original, 'Move to higher ground immediately. Do not drive through water. Call 911.')).toBe(true);
    expect(isSafetyPreserving(original, 'Flooding is nearby.')).toBe(false);
    expect(isSafetyPreserving(original, 'Move to higher ground immediately. Do not drive through water. Call 311.')).toBe(false);
    expect(isSafetyPreserving('Flooding is occurring.', 'Flooding is occurring. Evacuate now.')).toBe(false);
  });
});
