export type NotificationPermissionState =
  | 'unsupported'
  | 'not-determined'
  | 'denied'
  | 'granted'
  | 'provisional'
  | 'ephemeral'
  | 'error';

export type RawNotificationPermission = {
  status: 'granted' | 'denied' | 'undetermined';
  iosStatus?: number;
};

export type NotificationPlatform = 'ios' | 'android' | 'web';

export interface NotificationPermissionAdapter {
  getStatus(): Promise<NotificationPermissionState>;
  request(): Promise<NotificationPermissionState>;
}

export function normalizeNotificationPermissionStatus(
  permission: RawNotificationPermission,
  platform: NotificationPlatform,
): NotificationPermissionState {
  if (platform === 'ios') {
    if (permission.iosStatus === 0) return 'not-determined';
    if (permission.iosStatus === 1) return 'denied';
    if (permission.iosStatus === 2) return 'granted';
    if (permission.iosStatus === 3) return 'provisional';
    if (permission.iosStatus === 4) return 'ephemeral';
  }
  if (permission.status === 'granted') return 'granted';
  if (permission.status === 'denied') return 'denied';
  return 'not-determined';
}

export class NotificationPermissionService {
  constructor(private readonly adapter: NotificationPermissionAdapter) {}

  async getStatus(): Promise<NotificationPermissionState> {
    try {
      return await this.adapter.getStatus();
    } catch {
      return 'error';
    }
  }

  async request(): Promise<NotificationPermissionState> {
    try {
      return await this.adapter.request();
    } catch {
      return 'error';
    }
  }
}
