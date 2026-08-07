import type { ActionPlan, Alert, HazardType, UserPreferences } from '@/domain/models';

const floodSteps = [
  {
    id: 'move-higher',
    title: 'Move to higher ground',
    detail: 'Leave low-lying areas now. Do not wait for water to rise.',
    priority: 1,
  },
  {
    id: 'avoid-water',
    title: 'Stay out of floodwater',
    detail: 'Do not walk, swim, or drive through flooded roads.',
    priority: 2,
  },
  {
    id: 'follow-officials',
    title: 'Follow local instructions',
    detail: 'Be ready to evacuate if local officials tell you to leave.',
    priority: 3,
  },
  {
    id: 'charge-phone',
    title: 'Preserve phone power',
    detail: 'Charge your phone and keep a power bank nearby if it is safe to do so.',
    priority: 4,
  },
  {
    id: 'contact-person',
    title: 'Tell someone your plan',
    detail: 'Share where you are going with a trusted contact.',
    priority: 5,
  },
] as const;

export const demoFloodAlert: Alert = {
  id: 'demo-flood-001',
  providerId: 'SIMULATED-NWS-FLOOD-001',
  hazard: 'flood',
  headline: 'Flood Warning',
  summary: 'Flooding is simulated near low-lying roads. Move to higher ground and avoid flooded routes.',
  severity: 'severe',
  urgency: 'immediate',
  certainty: 'likely',
  status: 'active',
  areaDescription: 'Austin, Texas 78701',
  issuedAt: '2026-08-07T15:00:00-05:00',
  expiresAt: '2026-08-07T18:45:00-05:00',
  source: 'National Weather Service — simulated example',
  originalText:
    'SIMULATED ALERT. Flooding caused by heavy rainfall is possible in low-lying areas. Move to higher ground and follow instructions from local officials. Do not drive through flooded roadways.',
  retrievedAt: '2026-08-07T15:02:00-05:00',
  freshness: 'current',
  isDemo: true,
  doNow: floodSteps.slice(0, 3),
};

export const demoExpiredAlert: Alert = {
  ...demoFloodAlert,
  id: 'demo-flood-expired-001',
  providerId: 'SIMULATED-NWS-FLOOD-EXPIRED-001',
  headline: 'Flood Advisory ended',
  summary: 'This simulated advisory has ended. Continue to avoid any roads that remain flooded.',
  severity: 'moderate',
  urgency: 'past',
  status: 'expired',
  issuedAt: '2026-08-06T11:00:00-05:00',
  expiresAt: '2026-08-06T14:00:00-05:00',
  retrievedAt: '2026-08-06T14:04:00-05:00',
  freshness: 'cached',
};

export const demoFloodPlan: ActionPlan = {
  id: 'demo-flood-plan-001',
  alertId: demoFloodAlert.id,
  hazard: 'flood',
  title: 'Flood safety plan',
  rationale: 'Selected because the simulated alert is severe, immediate, and likely.',
  steps: [...floodSteps],
  sourceName: 'National Weather Service and Ready.gov',
  sourceNote: 'Reviewed against official flood-safety and preparedness guidance on August 7, 2026. Review again before production release.',
  sourceReferences: [
    { label: 'NWS: During a Flood', url: 'https://www.weather.gov/safety/flood-during' },
    { label: 'Ready.gov: Plan Ahead', url: 'https://www.ready.gov/' },
  ],
  isDemo: true,
};

export const defaultPreferences: UserPreferences = {
  hazards: ['flood', 'tornado', 'hurricane'],
  location: {
    id: 'primary-location',
    label: 'Home',
    city: 'Austin',
    region: 'TX',
    postalCode: '78701',
  },
  notificationsEnabled: false,
  language: 'en',
  textSize: 'standard',
  highContrast: false,
  plainLanguage: true,
  reducedMotion: false,
};

export const hazardLabels: Record<HazardType, string> = {
  flood: 'Flood',
  tornado: 'Tornado',
  hurricane: 'Hurricane',
  wildfire: 'Wildfire',
  'air-quality': 'Air quality',
  'winter-storm': 'Winter storm',
  earthquake: 'Earthquake',
};

export interface AlertRepository {
  getActive(): Promise<Alert[]>;
  getRecent(): Promise<Alert[]>;
  getById(id: string): Promise<Alert | null>;
}

export interface ActionPlanRepository {
  getForAlert(alertId: string): Promise<ActionPlan | null>;
}

export const mockAlertRepository: AlertRepository = {
  async getActive() {
    return [demoFloodAlert];
  },
  async getRecent() {
    return [demoExpiredAlert];
  },
  async getById(id) {
    return [demoFloodAlert, demoExpiredAlert].find((alert) => alert.id === id) ?? null;
  },
};

export const mockActionPlanRepository: ActionPlanRepository = {
  async getForAlert(alertId) {
    return alertId === demoFloodAlert.id ? demoFloodPlan : null;
  },
};
