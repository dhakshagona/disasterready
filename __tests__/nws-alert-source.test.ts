import { NwsAlertSource } from '@/infrastructure/nws/alert-source';
import { describe, expect, it } from '@jest/globals';

describe('NWS alert source', () => {
  it('normalizes client payloads before returning application alerts', async () => {
    const client = {
      fetchActiveForPoint: async () => ({
        type: 'FeatureCollection',
        features: [{
          id: 'https://api.weather.gov/alerts/test',
          properties: {
            id: 'provider-test',
            areaDesc: 'Travis County',
            sent: '2026-08-07T20:00:00.000Z',
            expires: '2026-08-07T22:00:00.000Z',
            messageType: 'Alert',
            severity: 'Moderate',
            certainty: 'Possible',
            urgency: 'Expected',
            event: 'Flood Advisory',
            senderName: 'National Weather Service',
            headline: 'Flood Advisory issued',
            description: 'Minor flooding is possible.',
          },
        }],
      }),
    };
    const source = new NwsAlertSource(client);

    const alerts = await source.getActive({ latitude: 30.2672, longitude: -97.7431 }, '2026-08-07T20:05:00.000Z');

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ providerId: 'provider-test', hazard: 'flood', retrievedAt: '2026-08-07T20:05:00.000Z' });
  });
});
