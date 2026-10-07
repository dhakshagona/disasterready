import { render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import HomeScreen from '@/app/(tabs)/home';
import { defaultPreferences } from '@/data/mock-repositories';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ demo: '1' }),
}));

describe('home screen analytics', () => {
  it('records a distinct demo session when a simulated alert is opened directly', async () => {
    const track = jest.fn(async () => undefined);
    const runtime: AppRuntime = {
      alertService: { getFeed: async () => ({ active: [], recent: [], source: 'live', isOffline: false, retrievedAt: null }) },
      safetyResourceService: { getFeed: async () => ({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: null, radiusMiles: 100 }) },
      mapRoutingService: { openDestination: async () => undefined },
      notificationPermissionService: { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
      analyticsService: { track },
      plainLanguageService: { simplify: async (alert) => ({ summary: alert.summary, source: 'deterministic', reason: 'unsupported' }) },
      preferencesRepository: { get: async () => defaultPreferences, save: async () => undefined },
      checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
    };

    await render(<DisasterReadyProvider runtime={runtime}><HomeScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(track).toHaveBeenCalledWith('session_started', { mode: 'demo' }));
    await waitFor(() => expect(track).toHaveBeenCalledWith('demo_session_started', {
      mode: 'demo',
      properties: { hazard: 'flood', entry: 'home' },
    }));
  });
});
