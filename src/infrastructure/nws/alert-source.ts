import type { AlertSource } from '@/application/alerts/live-alert-service';
import type { GeoPoint } from '@/infrastructure/nws/client';
import { parseNwsFeatureCollection } from '@/infrastructure/nws/normalizer';

export interface NwsClientPort {
  fetchActiveForPoint(point: GeoPoint): Promise<unknown>;
}

export class NwsAlertSource implements AlertSource {
  constructor(private readonly client: NwsClientPort) {}

  async getActive(point: GeoPoint, retrievedAt: string) {
    const payload = await this.client.fetchActiveForPoint(point);
    return parseNwsFeatureCollection(payload, retrievedAt);
  }
}
