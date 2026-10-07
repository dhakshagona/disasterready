import { render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import AlertDetailScreen from '@/app/alert/[id]';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'live-alert' }),
}));

describe('alert detail screen', () => {
  it('shows a validated AI simplification without replacing reviewed actions or the official alert', async () => {
    const liveAlert = {
      ...demoFloodAlert,
      id: 'live-alert',
      providerId: 'provider-live-alert',
      isDemo: false,
      summary: 'Deterministic alert summary.',
      originalText: 'Official National Weather Service alert text.',
    };
    const runtime: AppRuntime = {
      alertService: { getFeed: async () => ({ active: [liveAlert], recent: [], source: 'live', isOffline: false, retrievedAt: liveAlert.retrievedAt }) },
      safetyResourceService: { getFeed: async () => ({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: liveAlert.retrievedAt, radiusMiles: 100 }) },
      mapRoutingService: { openDestination: async () => undefined },
      notificationPermissionService: { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
      analyticsService: { track: async () => undefined },
      plainLanguageService: { simplify: async () => ({ summary: 'Validated plain-language alert summary.', source: 'ai' }) },
      preferencesRepository: { get: async () => ({ ...defaultPreferences, plainLanguage: true }), save: async () => undefined },
      checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
    };
    const screen = await render(<DisasterReadyProvider runtime={runtime}><AlertDetailScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByText('Validated plain-language alert summary.')).toBeTruthy());
    expect(screen.getByText('In simple words')).toBeTruthy();
    expect(screen.getByText('Gemini simplified and safety checked')).toBeTruthy();
    expect(screen.getByText(demoFloodAlert.doNow[0]!.title)).toBeTruthy();
    expect(screen.getByText('Official National Weather Service alert text.')).toBeTruthy();
    expect(screen.getByText('Check FEMA-reported shelter availability and routing.')).toBeTruthy();
  });
});
