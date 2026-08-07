import { Platform } from 'react-native';

import type { AppRuntime } from '@/application/app-context';
import { LiveAlertService } from '@/application/alerts/live-alert-service';
import { NwsAlertSource } from '@/infrastructure/nws/alert-source';
import { NwsAlertClient } from '@/infrastructure/nws/client';
import { LocalAlertCache, LocalChecklistProgressRepository, LocalPreferencesRepository } from '@/infrastructure/storage/local-repositories';
import { platformStorage } from '@/infrastructure/storage/platform-storage';

const alertCache = new LocalAlertCache(platformStorage);
const nwsClient = new NwsAlertClient({ platform: Platform.OS === 'web' ? 'web' : 'native' });

export const defaultRuntime: AppRuntime = {
  alertService: new LiveAlertService({ source: new NwsAlertSource(nwsClient), cache: alertCache }),
  preferencesRepository: new LocalPreferencesRepository(platformStorage),
  checklistRepository: new LocalChecklistProgressRepository(platformStorage),
};
