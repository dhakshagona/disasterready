import type { NotificationPermissionAdapter } from '@/application/notifications/notification-permission-service';

export const webNotificationPermissionAdapter: NotificationPermissionAdapter = {
  getStatus: async () => 'unsupported',
  request: async () => 'unsupported',
};

export const platformNotificationPermissionAdapter = webNotificationPermissionAdapter;
