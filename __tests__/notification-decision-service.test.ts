import { describe, expect, it, jest } from '@jest/globals';

import { NotificationDecisionService, notificationFingerprint, type NotificationDecisionReason } from '@/application/notifications/notification-decision-service';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';
import type { Alert, UserPreferences } from '@/domain/models';

function alert(overrides: Partial<Alert> = {}): Alert {
  return {
    ...demoFloodAlert,
    id: 'live-alert',
    providerId: 'nws-alert-123',
    isDemo: false,
    status: 'active',
    hazard: 'flood',
    severity: 'severe',
    urgency: 'expected',
    issuedAt: '2026-08-08T01:00:00.000Z',
    ...overrides,
  };
}

function service(seen = false) {
  const receipts = {
    has: jest.fn(async () => seen),
    record: jest.fn(async () => undefined),
  };
  return { decisions: new NotificationDecisionService(receipts), receipts };
}

describe('notification decision service', () => {
  it('accepts a matching severe live alert and records its fingerprint', async () => {
    const { decisions, receipts } = service();

    await expect(decisions.evaluate(alert(), { ...defaultPreferences, notificationsEnabled: true })).resolves.toEqual({ shouldNotify: true, reason: 'eligible' });
    expect(receipts.record).toHaveBeenCalledWith('nws-alert-123:2026-08-08T01:00:00.000Z');
  });

  it('accepts an immediate matching alert even below the normal severity threshold', async () => {
    const { decisions } = service();

    await expect(decisions.evaluate(alert({ severity: 'moderate', urgency: 'immediate' }), { ...defaultPreferences, notificationsEnabled: true })).resolves.toEqual({ shouldNotify: true, reason: 'eligible' });
  });

  it.each<[NotificationDecisionReason, Alert, UserPreferences]>([
    ['notifications-disabled', alert(), { ...defaultPreferences, notificationsEnabled: false }],
    ['demo-alert', alert({ isDemo: true }), { ...defaultPreferences, notificationsEnabled: true }],
    ['inactive-alert', alert({ status: 'expired' }), { ...defaultPreferences, notificationsEnabled: true }],
    ['hazard-not-selected', alert({ hazard: 'wildfire' }), { ...defaultPreferences, notificationsEnabled: true }],
    ['below-threshold', alert({ severity: 'moderate', urgency: 'expected' }), { ...defaultPreferences, notificationsEnabled: true }],
  ])('rejects an ineligible alert with reason %s', async (reason, candidate, preferences) => {
    const { decisions, receipts } = service();

    await expect(decisions.evaluate(candidate, preferences)).resolves.toEqual({ shouldNotify: false, reason });
    expect(receipts.has).not.toHaveBeenCalled();
    expect(receipts.record).not.toHaveBeenCalled();
  });

  it('rejects an alert fingerprint that has already been recorded', async () => {
    const { decisions, receipts } = service(true);

    await expect(decisions.evaluate(alert(), { ...defaultPreferences, notificationsEnabled: true })).resolves.toEqual({ shouldNotify: false, reason: 'duplicate' });
    expect(receipts.record).not.toHaveBeenCalled();
  });

  it('uses provider identity and issue time so a provider update can be evaluated once', () => {
    expect(notificationFingerprint(alert())).toBe('nws-alert-123:2026-08-08T01:00:00.000Z');
  });
});
