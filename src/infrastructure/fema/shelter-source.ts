import type { ShelterSource } from '@/application/safety-resources/safety-resource-service';
import type { ShelterSearchPoint } from '@/infrastructure/fema/client';
import { parseFemaShelterResponse } from '@/infrastructure/fema/normalizer';

export interface FemaShelterClientPort {
  fetchNearby(point: ShelterSearchPoint, radiusMiles: number): Promise<unknown>;
}

export class FemaShelterSource implements ShelterSource {
  constructor(private readonly client: FemaShelterClientPort) {}

  async getNearby(point: ShelterSearchPoint, radiusMiles: number, retrievedAt: string) {
    return parseFemaShelterResponse(await this.client.fetchNearby(point, radiusMiles), retrievedAt);
  }
}
