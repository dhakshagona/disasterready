import { describe, expect, it } from '@jest/globals';

import {
  NotificationPermissionService,
  normalizeNotificationPermissionStatus,
  type NotificationPermissionAdapter,
} from '@/application/notifications/notification-permission-service';
import { webNotificationPermissionAdapter } from '@/infrastructure/notifications/platform-notifications.web';

describe('notification permission service', () => {
  it('interprets granular iOS authorization states', () => {
    expect(normalizeNotificationPermissionStatus({ status: 'granted', iosStatus: 2 }, 'ios')).toBe('granted');
    expect(normalizeNotificationPermissionStatus({ status: 'granted', iosStatus: 3 }, 'ios')).toBe('provisional');
    expect(normalizeNotificationPermissionStatus({ status: 'granted', iosStatus: 4 }, 'ios')).toBe('ephemeral');
    expect(normalizeNotificationPermissionStatus({ status: 'denied', iosStatus: 1 }, 'ios')).toBe('denied');
  });

  it('uses the cross-platform root status on Android', () => {
    expect(normalizeNotificationPermissionStatus({ status: 'undetermined' }, 'android')).toBe('not-determined');
    expect(normalizeNotificationPermissionStatus({ status: 'granted' }, 'android')).toBe('granted');
  });

  it('provides an explicit unsupported web fallback', async () => {
    const service = new NotificationPermissionService(webNotificationPermissionAdapter);

    await expect(service.getStatus()).resolves.toBe('unsupported');
    await expect(service.request()).resolves.toBe('unsupported');
  });

  it('returns an error state instead of throwing when the native adapter fails', async () => {
    const adapter: NotificationPermissionAdapter = {
      getStatus: async () => { throw new Error('native module unavailable'); },
      request: async () => { throw new Error('native module unavailable'); },
    };
    const service = new NotificationPermissionService(adapter);

    await expect(service.getStatus()).resolves.toBe('error');
    await expect(service.request()).resolves.toBe('error');
  });
});
