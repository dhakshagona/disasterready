import type { AlertSource } from '@/application/alerts/live-alert-service';
import type { GeoPoint } from '@/infrastructure/nws/client';
import { parseNwsFeatureCollection } from '@/infrastructure/nws/normalizer';

export interface NwsClientPort {
  fetchActiveForPoint(point: GeoPoint): Promise<unknown>;
}

export type NormalizedAlertMetadata = { count: number; hazards: string[] };

export class NwsAlertSource implements AlertSource {
  constructor(
    private readonly client: NwsClientPort,
    private readonly onNormalized?: (metadata: NormalizedAlertMetadata) => void,
  ) {}

  async getActive(point: GeoPoint, retrievedAt: string) {
    const payload = await this.client.fetchActiveForPoint(point);
    const alerts = parseNwsFeatureCollection(payload, retrievedAt);
    this.onNormalized?.({ count: alerts.length, hazards: [...new Set(alerts.map((alert) => alert.hazard))].sort() });
    return alerts;
  }
}
