import { describe, expect, it } from '@jest/globals';

import { normalizeFemaShelterFeature, parseFemaShelterResponse } from '@/infrastructure/fema/normalizer';

const feature = {
  attributes: {
    shelter_id: 368305,
    shelter_name: 'Lake Roosevelt Schools',
    address_1: '505 Crest Dr',
    city: 'Coulee Dam',
    state: 'WA',
    zip: '99116',
    shelter_status_code: 'OPEN',
    evacuation_capacity: 250,
    ada_compliant: 'YES',
    wheelchair_accessible: 'UNK',
    pet_accommodations_desc: 'Household pets accepted in a separate area',
    org_organization_name: 'FEMA ESF #6 partner',
    org_main_phone: '5095550100',
  },
  geometry: { x: -118.970904, y: 47.971786 },
};

describe('FEMA shelter normalization', () => {
  it('normalizes official open-shelter fields and geometry', () => {
    const shelter = normalizeFemaShelterFeature(feature, '2026-08-08T00:00:00.000Z');

    expect(shelter).toMatchObject({
      id: 'fema-368305',
      name: 'Lake Roosevelt Schools',
      status: 'open',
      address: '505 Crest Dr, Coulee Dam, WA 99116',
      latitude: 47.971786,
      longitude: -118.970904,
      capacity: 250,
      phone: '5095550100',
      accessibilityNotes: 'ADA compliant: yes. Wheelchair accessible: unknown.',
      petNotes: 'Household pets accepted in a separate area',
      lastUpdatedAt: '2026-08-08T00:00:00.000Z',
      source: 'FEMA ESF #6 Shelter System',
      isVerified: true,
    });
  });

  it('rejects records without a usable name, address, or coordinate', () => {
    expect(normalizeFemaShelterFeature({ attributes: { shelter_id: 1 } }, '2026-08-08T00:00:00.000Z')).toBeNull();
  });

  it('rejects provider error payloads at the boundary', () => {
    expect(() => parseFemaShelterResponse({ error: { message: 'Invalid query' } }, '2026-08-08T00:00:00.000Z')).toThrow('FEMA shelter request failed');
  });
});
