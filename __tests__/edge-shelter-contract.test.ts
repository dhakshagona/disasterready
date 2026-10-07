import { describe, expect, it } from '@jest/globals';

import { parseShelterProxyInput } from '../supabase/functions/_shared/shelter-contract';

describe('shelter proxy contract', () => {
  it('accepts a bounded coordinate search', () => {
    expect(parseShelterProxyInput({ latitude: 30.2672, longitude: -97.7431, radiusMiles: 100 })).toEqual({
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 100,
    });
  });

  it('rejects invalid coordinates, radiuses, and extra fields', () => {
    expect(() => parseShelterProxyInput({ latitude: 91, longitude: -97, radiusMiles: 100 })).toThrow('coordinates');
    expect(() => parseShelterProxyInput({ latitude: 30, longitude: -97, radiusMiles: 101 })).toThrow('radius');
    expect(() => parseShelterProxyInput({ latitude: 30, longitude: -97, radiusMiles: 100, postalCode: '78701' })).toThrow('request');
  });
});
