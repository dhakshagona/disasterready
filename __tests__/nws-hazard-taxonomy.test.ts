import { describe, expect, it } from '@jest/globals';

import { expectedHazardForEvent, reviewedEvents } from '../scripts/evidence/nws-hazard-taxonomy';

describe('NWS evidence hazard taxonomy', () => {
  it.each([
    ['Flash Flood Warning', 'flood'],
    ['Tornado Warning', 'tornado'],
    ['Hurricane Warning', 'hurricane'],
    ['Red Flag Warning', 'wildfire'],
    ['Air Quality Alert', 'air-quality'],
    ['Winter Storm Warning', 'winter-storm'],
  ] as ReadonlyArray<readonly [string, string]>)('maps %s to %s', (event, expected) => {
    expect(expectedHazardForEvent(event)).toBe(expected);
  });

  it('uses other for events outside the reviewed mapping', () => {
    expect(expectedHazardForEvent('Severe Thunderstorm Warning')).toBe('other');
  });

  it('contains a substantial explicit reviewed event list', () => {
    expect(reviewedEvents().length).toBeGreaterThanOrEqual(40);
  });
});
