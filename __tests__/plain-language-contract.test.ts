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
    expect(() => parsePlainLanguageInput({ hazard: 'flood', officialText: 'Valid text', deterministicSummary: 'Valid summary', extra: true })).toThrow('shape');
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

  it('treats directives as whole words and preserves numeric units exactly', () => {
    expect(isSafetyPreserving('A recall notice is active.', 'A recall notice is active.')).toBe(true);
    expect(isSafetyPreserving('Stay 1.5 miles away for 30 minutes.', 'Stay 1.5 miles away for 30 minutes.')).toBe(true);
    expect(isSafetyPreserving('Stay 1.5 miles away for 30 minutes.', 'Stay 1.5 feet away for 30 minutes.')).toBe(false);
    expect(isSafetyPreserving('Flooding is occurring.', 'Flooding is not occurring.')).toBe(false);
  });

  it('rejects inverted directives and reordered safety facts', () => {
    expect(isSafetyPreserving(
      'Do not drive through water. Evacuate immediately.',
      'Drive through water. Do not evacuate. Immediately.',
    )).toBe(false);
    expect(isSafetyPreserving(
      'Stay 5 miles away for 10 minutes.',
      'Stay 10 minutes away for 5 miles.',
    )).toBe(false);
    expect(isSafetyPreserving(
      'Do not enter, remain outside.',
      'Do not remain, enter outside.',
    )).toBe(false);
  });

  it('expands contracted negation before comparing directive polarity', () => {
    expect(isSafetyPreserving(
      "Don't drive through water.",
      'Drive through water.',
    )).toBe(false);
    expect(isSafetyPreserving(
      "Don't drive through water.",
      'Do not drive through water.',
    )).toBe(true);
    expect(isSafetyPreserving(
      'You can’t return until officials say it is safe.',
      'You can return until officials say it is safe.',
    )).toBe(false);
  });
});
