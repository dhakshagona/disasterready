import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  normalizeNotificationPermissionStatus,
  type NotificationPermissionAdapter,
  type RawNotificationPermission,
} from '@/application/notifications/notification-permission-service';

function normalize(status: Notifications.NotificationPermissionsStatus) {
  const raw: RawNotificationPermission = {
    status: status.status,
    ...(status.ios ? { iosStatus: status.ios.status } : {}),
  };
  return normalizeNotificationPermissionStatus(raw, Platform.OS === 'ios' ? 'ios' : 'android');
}

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('emergency-alerts', {
    name: 'Emergency alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E5484D',
  });
}

export const platformNotificationPermissionAdapter: NotificationPermissionAdapter = {
  async getStatus() {
    return normalize(await Notifications.getPermissionsAsync());
  },
  async request() {
    await prepareAndroidChannel();
    return normalize(await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    }));
  },
};
