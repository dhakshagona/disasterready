import type { Alert, UserPreferences } from '@/domain/models';

export type NotificationDecisionReason =
  | 'eligible'
  | 'notifications-disabled'
  | 'demo-alert'
  | 'inactive-alert'
  | 'hazard-not-selected'
  | 'below-threshold'
  | 'duplicate';

export type NotificationDecision = {
  shouldNotify: boolean;
  reason: NotificationDecisionReason;
};

export interface NotificationReceiptRepository {
  has(fingerprint: string): Promise<boolean>;
  record(fingerprint: string): Promise<void>;
}

export function notificationFingerprint(alert: Alert): string {
  return `${alert.providerId}:${alert.issuedAt}`;
}

function eligibilityReason(alert: Alert, preferences: UserPreferences): NotificationDecisionReason {
  if (!preferences.notificationsEnabled) return 'notifications-disabled';
  if (alert.isDemo) return 'demo-alert';
  if (alert.status !== 'active') return 'inactive-alert';
  if (!preferences.hazards.includes(alert.hazard)) return 'hazard-not-selected';
  if (alert.severity !== 'severe' && alert.severity !== 'extreme' && alert.urgency !== 'immediate') return 'below-threshold';
  return 'eligible';
}

export class NotificationDecisionService {
  constructor(private readonly receipts: NotificationReceiptRepository) {}

  async evaluate(alert: Alert, preferences: UserPreferences): Promise<NotificationDecision> {
    const reason = eligibilityReason(alert, preferences);
    if (reason !== 'eligible') return { shouldNotify: false, reason };

    const fingerprint = notificationFingerprint(alert);
    if (await this.receipts.has(fingerprint)) return { shouldNotify: false, reason: 'duplicate' };

    await this.receipts.record(fingerprint);
    return { shouldNotify: true, reason: 'eligible' };
  }
}
