export type HazardType =
  | 'flood'
  | 'tornado'
  | 'hurricane'
  | 'wildfire'
  | 'air-quality'
  | 'winter-storm'
  | 'earthquake'
  | 'other';

export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
export type AlertUrgency = 'past' | 'future' | 'expected' | 'immediate' | 'unknown';
export type AlertCertainty = 'unlikely' | 'possible' | 'likely' | 'observed' | 'unknown';
export type AlertStatus = 'active' | 'expired';
export type DataFreshness = 'current' | 'cached' | 'stale';

export type ActionStep = {
  id: string;
  title: string;
  detail: string;
  priority: number;
};

export type Alert = {
  id: string;
  providerId: string;
  hazard: HazardType;
  headline: string;
  summary: string;
  severity: AlertSeverity;
  urgency: AlertUrgency;
  certainty: AlertCertainty;
  status: AlertStatus;
  areaDescription: string;
  issuedAt: string;
  expiresAt: string;
  source: string;
  originalText: string;
  sourceUrl?: string;
  retrievedAt: string;
  freshness: DataFreshness;
  isDemo: boolean;
  doNow: ActionStep[];
};

export type ActionPlan = {
  id: string;
  alertId: string;
  hazard: HazardType;
  title: string;
  rationale: string;
  steps: ActionStep[];
  sourceName: string;
  sourceNote: string;
  sourceReferences: { label: string; url: string }[];
  isDemo: boolean;
};

export type ShelterStatus = 'open' | 'closed' | 'unknown';

export type Shelter = {
  id: string;
  name: string;
  status: ShelterStatus;
  address: string;
  distanceMiles?: number;
  lastUpdatedAt: string;
  source: string;
  accessibilityNotes?: string;
  isVerified: boolean;
};

export type SavedLocation = {
  id: string;
  label: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

export type UserPreferences = {
  hazards: HazardType[];
  location: SavedLocation;
  notificationsEnabled: boolean;
  language: 'en' | 'es';
  textSize: 'standard' | 'large' | 'extra-large';
  highContrast: boolean;
  plainLanguage: boolean;
  reducedMotion: boolean;
};
