import { describe, expect, it, jest } from '@jest/globals';

import { FemaShelterSource } from '@/infrastructure/fema/shelter-source';

describe('FEMA shelter source', () => {
  it('normalizes client payloads with the service retrieval time', async () => {
    const fetchNearby = jest.fn(async () => ({
      features: [{
        attributes: {
          shelter_id: 1,
          shelter_name: 'Official Shelter',
          address_1: '100 Main St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          shelter_status_code: 'OPEN',
        },
        geometry: { x: -97.74, y: 30.27 },
      }],
    }));
    const source = new FemaShelterSource({ fetchNearby });

    const shelters = await source.getNearby({ latitude: 30.2672, longitude: -97.7431 }, 100, '2026-08-08T00:00:00.000Z');

    expect(fetchNearby).toHaveBeenCalledWith({ latitude: 30.2672, longitude: -97.7431 }, 100);
    expect(shelters).toEqual([expect.objectContaining({ id: 'fema-1', lastUpdatedAt: '2026-08-08T00:00:00.000Z' })]);
  });
});
