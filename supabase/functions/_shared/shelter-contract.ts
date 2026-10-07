export type ShelterProxyInput = {
  latitude: number;
  longitude: number;
  radiusMiles: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseShelterProxyInput(value: unknown): ShelterProxyInput {
  if (!isRecord(value) || Object.keys(value).some((key) => !['latitude', 'longitude', 'radiusMiles'].includes(key))) {
    throw new Error('Invalid shelter request');
  }
  const { latitude, longitude, radiusMiles } = value;
  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) throw new Error('Invalid shelter search coordinates');
  if (typeof radiusMiles !== 'number' || !Number.isFinite(radiusMiles) || radiusMiles < 1 || radiusMiles > 100) {
    throw new Error('Invalid shelter search radius');
  }
  return { latitude, longitude, radiusMiles };
}
