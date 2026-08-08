import { describe, expect, it } from '@jest/globals';

import { PlainLanguageService, PlainLanguageUnavailableError } from '@/application/plain-language/plain-language-service';
import { demoFloodAlert } from '@/data/mock-repositories';
import type { Alert } from '@/domain/models';

const liveAlert: Alert = {
  ...demoFloodAlert,
  id: 'live-flood',
  providerId: 'nws-live-flood',
  isDemo: false,
  summary: 'Flash flooding is occurring in the warned area.',
  originalText: 'Flash flooding is occurring. Move to higher ground immediately. Do not drive through flooded roads.',
};

describe('plain-language service', () => {
  it('uses validated AI simplification while preserving the deterministic safety plan', async () => {
    const service = new PlainLanguageService({
      provider: { simplify: async () => ({ plainSummary: 'Flash flooding is happening. Move to higher ground immediately. Do not drive on flooded roads.' }) },
    });

    await expect(service.simplify(liveAlert)).resolves.toEqual({
      summary: 'Flash flooding is happening. Move to higher ground immediately. Do not drive on flooded roads.',
      source: 'ai',
    });
    expect(liveAlert.doNow).toEqual(demoFloodAlert.doNow);
  });

  it('falls back when no server-side provider is configured', async () => {
    const service = new PlainLanguageService();

    await expect(service.simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'not-configured',
    });
  });

  it('rejects malformed or schema-invalid provider output', async () => {
    const service = new PlainLanguageService({ provider: { simplify: async () => ({ summary: 'Wrong field' }) } });

    await expect(service.simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'schema-invalid',
    });
  });

  it('rejects output that removes a critical instruction', async () => {
    const service = new PlainLanguageService({
      provider: { simplify: async () => ({ plainSummary: 'Flash flooding is happening near you.' }) },
    });

    await expect(service.simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'safety-invalid',
    });
  });

  it('rejects output that invents a new directive', async () => {
    const alertWithoutCall = { ...liveAlert, originalText: 'Flooding is occurring. Avoid flooded roads.' };
    const service = new PlainLanguageService({
      provider: { simplify: async () => ({ plainSummary: 'Flooding is happening. Avoid flooded roads and call emergency services.' }) },
    });

    await expect(service.simplify(alertWithoutCall)).resolves.toEqual({
      summary: alertWithoutCall.summary,
      source: 'deterministic',
      reason: 'safety-invalid',
    });
  });

  it('falls back for timeout, provider failure, and demo content', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'AbortError';

    await expect(new PlainLanguageService({ provider: { simplify: async () => { throw timeout; } } }).simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'timeout',
    });
    await expect(new PlainLanguageService({ provider: { simplify: async () => { throw new Error('unavailable'); } } }).simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'provider-error',
    });
    await expect(new PlainLanguageService({ provider: { simplify: async () => ({ plainSummary: 'unused' }) } }).simplify(demoFloodAlert)).resolves.toEqual({
      summary: demoFloodAlert.summary,
      source: 'deterministic',
      reason: 'unsupported',
    });
  });

  it('preserves an explicit server configuration fallback reason', async () => {
    const service = new PlainLanguageService({
      provider: { simplify: async () => { throw new PlainLanguageUnavailableError('not-configured'); } },
    });

    await expect(service.simplify(liveAlert)).resolves.toEqual({
      summary: liveAlert.summary,
      source: 'deterministic',
      reason: 'not-configured',
    });
  });
});
