export type ShelterSearchPoint = { latitude: number; longitude: number };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type FemaShelterClientOptions = {
  fetcher?: FetchLike;
  timeoutMs?: number;
};

const layerUrl = 'https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0/query';
const outFields = [
  'shelter_id', 'shelter_name', 'address_1', 'city', 'state', 'zip',
  'shelter_status_code', 'evacuation_capacity', 'ada_compliant',
  'wheelchair_accessible', 'pet_accommodations_desc',
  'org_organization_name', 'org_main_phone', 'shelter_open_date',
  'reporting_period', 'latitude', 'longitude', 'geox', 'geoy',
].join(',');

export function validateShelterSearch(point: ShelterSearchPoint, radiusMiles: number) {
  if (
    !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
    point.latitude < -90 || point.latitude > 90 ||
    point.longitude < -180 || point.longitude > 180
  ) throw new Error('Invalid shelter search coordinates');
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0 || radiusMiles > 500) throw new Error('Invalid shelter search radius');
}

export class FemaShelterClient {
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;

  constructor({ fetcher = fetch, timeoutMs = 10_000 }: FemaShelterClientOptions = {}) {
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async fetchNearby(point: ShelterSearchPoint, radiusMiles: number): Promise<unknown> {
    validateShelterSearch(point, radiusMiles);
    const query = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields,
      returnGeometry: 'true',
      geometry: `${point.longitude},${point.latitude}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: String(radiusMiles),
      units: 'esriSRUnit_StatuteMile',
      outSR: '4326',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${layerUrl}?${query.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`FEMA shelter request failed with status ${response.status}`);
      return response.json() as Promise<unknown>;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('FEMA shelter request timed out');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
