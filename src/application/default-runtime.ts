import { Linking, Platform } from 'react-native';

import type { AppRuntime } from '@/application/app-context';
import { LiveAlertService } from '@/application/alerts/live-alert-service';
import { AnalyticsService } from '@/application/analytics/analytics-service';
import { MapRoutingService, type MapPlatform } from '@/application/routing/map-routing-service';
import { NotificationPermissionService } from '@/application/notifications/notification-permission-service';
import { PlainLanguageService } from '@/application/plain-language/plain-language-service';
import { SafetyResourceService } from '@/application/safety-resources/safety-resource-service';
import { SupabaseAnalyticsTransport } from '@/infrastructure/analytics/supabase-analytics-transport';
import { FemaShelterClient } from '@/infrastructure/fema/client';
import { FemaShelterSource } from '@/infrastructure/fema/shelter-source';
import { FallbackFemaShelterClient, SupabaseShelterProxyClient } from '@/infrastructure/fema/supabase-shelter-proxy-client';
import { platformNotificationPermissionAdapter } from '@/infrastructure/notifications/platform-notifications';
import { NwsAlertSource } from '@/infrastructure/nws/alert-source';
import { NwsAlertClient } from '@/infrastructure/nws/client';
import { SupabasePlainLanguageProvider } from '@/infrastructure/plain-language/supabase-plain-language-provider';
import { LocalAlertCache, LocalAnalyticsOutbox, LocalChecklistProgressRepository, LocalPreferencesRepository, LocalShelterCache } from '@/infrastructure/storage/local-repositories';
import { platformStorage } from '@/infrastructure/storage/platform-storage';

const alertCache = new LocalAlertCache(platformStorage);
const shelterCache = new LocalShelterCache(platformStorage);
const nwsClient = new NwsAlertClient({ platform: Platform.OS === 'web' ? 'web' : 'native' });
const mapPlatform: MapPlatform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseConfiguration = Boolean(supabaseUrl && supabasePublishableKey);
const directFemaClient = new FemaShelterClient();
const femaClient = hasSupabaseConfiguration
  ? new FallbackFemaShelterClient(
      new SupabaseShelterProxyClient({ projectUrl: supabaseUrl!, publishableKey: supabasePublishableKey! }),
      directFemaClient,
    )
  : directFemaClient;
const analyticsService = new AnalyticsService({
  outbox: new LocalAnalyticsOutbox(platformStorage),
  transport: hasSupabaseConfiguration
    ? new SupabaseAnalyticsTransport({ projectUrl: supabaseUrl!, publishableKey: supabasePublishableKey! })
    : undefined,
});
const plainLanguageService = new PlainLanguageService({
  provider: hasSupabaseConfiguration
    ? new SupabasePlainLanguageProvider({ projectUrl: supabaseUrl!, publishableKey: supabasePublishableKey! })
    : undefined,
});
const alertSource = new NwsAlertSource(nwsClient, ({ count, hazards }) => {
  void analyticsService.track('alerts_normalized', { mode: 'real', properties: { count, hazards } });
});

export const defaultRuntime: AppRuntime = {
  alertService: new LiveAlertService({ source: alertSource, cache: alertCache }),
  safetyResourceService: new SafetyResourceService({ source: new FemaShelterSource(femaClient), cache: shelterCache }),
  mapRoutingService: new MapRoutingService(mapPlatform, Linking),
  notificationPermissionService: new NotificationPermissionService(platformNotificationPermissionAdapter),
  analyticsService,
  plainLanguageService,
  preferencesRepository: new LocalPreferencesRepository(platformStorage),
  checklistRepository: new LocalChecklistProgressRepository(platformStorage),
};
