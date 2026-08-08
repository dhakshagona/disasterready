import { Linking, Platform } from 'react-native';

import type { AppRuntime } from '@/application/app-context';
import { LiveAlertService } from '@/application/alerts/live-alert-service';
import { MapRoutingService, type MapPlatform } from '@/application/routing/map-routing-service';
import { NotificationPermissionService } from '@/application/notifications/notification-permission-service';
import { SafetyResourceService } from '@/application/safety-resources/safety-resource-service';
import { FemaShelterClient } from '@/infrastructure/fema/client';
import { FemaShelterSource } from '@/infrastructure/fema/shelter-source';
import { platformNotificationPermissionAdapter } from '@/infrastructure/notifications/platform-notifications';
import { NwsAlertSource } from '@/infrastructure/nws/alert-source';
import { NwsAlertClient } from '@/infrastructure/nws/client';
import { LocalAlertCache, LocalChecklistProgressRepository, LocalPreferencesRepository, LocalShelterCache } from '@/infrastructure/storage/local-repositories';
import { platformStorage } from '@/infrastructure/storage/platform-storage';

const alertCache = new LocalAlertCache(platformStorage);
const shelterCache = new LocalShelterCache(platformStorage);
const nwsClient = new NwsAlertClient({ platform: Platform.OS === 'web' ? 'web' : 'native' });
const mapPlatform: MapPlatform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

export const defaultRuntime: AppRuntime = {
  alertService: new LiveAlertService({ source: new NwsAlertSource(nwsClient), cache: alertCache }),
  safetyResourceService: new SafetyResourceService({ source: new FemaShelterSource(new FemaShelterClient()), cache: shelterCache }),
  mapRoutingService: new MapRoutingService(mapPlatform, Linking),
  notificationPermissionService: new NotificationPermissionService(platformNotificationPermissionAdapter),
  preferencesRepository: new LocalPreferencesRepository(platformStorage),
  checklistRepository: new LocalChecklistProgressRepository(platformStorage),
};
