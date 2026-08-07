import { normalizeNwsFeature, parseNwsFeatureCollection } from '@/infrastructure/nws/normalizer';
import { describe, expect, it } from '@jest/globals';

const floodFeature = {
  id: 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.test-flood',
  type: 'Feature',
  properties: {
    id: 'urn:oid:2.49.0.1.840.0.test-flood',
    areaDesc: 'Travis County, Texas',
    sent: '2026-08-07T15:00:00-05:00',
    effective: '2026-08-07T15:00:00-05:00',
    expires: '2026-08-07T18:45:00-05:00',
    status: 'Actual',
    messageType: 'Alert',
    severity: 'Severe',
    certainty: 'Likely',
    urgency: 'Immediate',
    event: 'Flash Flood Warning',
    senderName: 'NWS Austin/San Antonio TX',
    headline: 'Flash Flood Warning issued for Travis County',
    description: 'Flash flooding is occurring in low-lying areas.\n\nMove away from flooded roads.',
    instruction: 'Move to higher ground now. Do not drive through flooded roads.',
  },
};

describe('NWS alert normalization', () => {
  it('normalizes a valid GeoJSON feature without leaking provider fields into UI models', () => {
    const alert = normalizeNwsFeature(floodFeature, '2026-08-07T20:05:00.000Z');

    expect(alert).toMatchObject({
      providerId: 'urn:oid:2.49.0.1.840.0.test-flood',
      hazard: 'flood',
      headline: 'Flash Flood Warning issued for Travis County',
      summary: 'Flash flooding is occurring in low-lying areas.',
      severity: 'severe',
      urgency: 'immediate',
      certainty: 'likely',
      status: 'active',
      areaDescription: 'Travis County, Texas',
      source: 'NWS Austin/San Antonio TX',
      sourceUrl: floodFeature.id,
      freshness: 'current',
      isDemo: false,
      doNow: [],
    });
    expect(alert?.id).toMatch(/^nws-/);
    expect(alert?.originalText).toContain('Move to higher ground now.');
  });

  it('maps unsupported weather events to other instead of silently discarding them', () => {
    const alert = normalizeNwsFeature(
      { ...floodFeature, properties: { ...floodFeature.properties, event: 'Dense Fog Advisory' } },
      '2026-08-07T20:05:00.000Z',
    );

    expect(alert?.hazard).toBe('other');
  });

  it('rejects malformed feature collections at the provider boundary', () => {
    expect(() => parseNwsFeatureCollection({ type: 'FeatureCollection', features: 'not-an-array' }, '2026-08-07T20:05:00.000Z')).toThrow(
      'Invalid NWS feature collection',
    );
  });
});
