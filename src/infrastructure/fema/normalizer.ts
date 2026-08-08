import type { Shelter } from '@/domain/models';

type UnknownRecord = Record<string, unknown>;

const sourceUrl = 'https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function number(record: UnknownRecord, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function yesNoUnknown(value: string | null): string {
  const normalized = value?.toUpperCase();
  if (normalized === 'YES' || normalized === 'Y') return 'yes';
  if (normalized === 'NO' || normalized === 'N') return 'no';
  return 'unknown';
}

function coordinates(feature: UnknownRecord, attributes: UnknownRecord): { latitude: number; longitude: number } | null {
  const geometry = isRecord(feature.geometry) ? feature.geometry : {};
  const longitude = number(geometry, 'x') ?? number(attributes, 'longitude') ?? number(attributes, 'geox');
  const latitude = number(geometry, 'y') ?? number(attributes, 'latitude') ?? number(attributes, 'geoy');
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function normalizeFemaShelterFeature(feature: unknown, retrievedAt: string): Shelter | null {
  if (!isRecord(feature) || !isRecord(feature.attributes)) return null;
  const attributes = feature.attributes;
  const shelterId = number(attributes, 'shelter_id');
  const name = text(attributes, 'shelter_name');
  const street = text(attributes, 'address_1') ?? text(attributes, 'address');
  const city = text(attributes, 'city');
  const region = text(attributes, 'state');
  const postalCode = text(attributes, 'zip');
  const point = coordinates(feature, attributes);
  if (shelterId === null || !name || !street || !city || !region || !point) return null;

  const statusCode = text(attributes, 'shelter_status_code')?.toUpperCase();
  const status = statusCode === 'OPEN' ? 'open' : statusCode === 'CLOSED' ? 'closed' : 'unknown';
  const capacity = number(attributes, 'evacuation_capacity');
  const phone = text(attributes, 'org_main_phone');
  const petNotes = text(attributes, 'pet_accommodations_desc');
  const accessibilityNotes = `ADA compliant: ${yesNoUnknown(text(attributes, 'ada_compliant'))}. Wheelchair accessible: ${yesNoUnknown(text(attributes, 'wheelchair_accessible'))}.`;
  const address = [street, city, region, postalCode].filter(Boolean).join(', ').replace(`, ${region},`, `, ${region}`);

  return {
    id: `fema-${shelterId}`,
    name,
    status,
    address,
    ...point,
    ...(capacity === null ? {} : { capacity }),
    ...(phone ? { phone } : {}),
    ...(petNotes ? { petNotes } : {}),
    lastUpdatedAt: retrievedAt,
    source: 'FEMA ESF #6 Shelter System',
    sourceUrl,
    accessibilityNotes,
    isVerified: true,
  };
}

export function parseFemaShelterResponse(payload: unknown, retrievedAt: string): Shelter[] {
  if (!isRecord(payload)) throw new Error('Invalid FEMA shelter response');
  if (isRecord(payload.error)) {
    const message = text(payload.error, 'message') ?? 'Unknown provider error';
    throw new Error(`FEMA shelter request failed: ${message}`);
  }
  if (!Array.isArray(payload.features)) throw new Error('Invalid FEMA shelter response');
  return payload.features.flatMap((feature) => {
    const shelter = normalizeFemaShelterFeature(feature, retrievedAt);
    return shelter ? [shelter] : [];
  });
}
