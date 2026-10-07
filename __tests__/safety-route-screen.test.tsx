import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import SafetyRouteScreen from '@/app/safety-route/[id]';
import type { ShelterFeed } from '@/application/safety-resources/safety-resource-service';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';
import type { Alert } from '@/domain/models';

let mockAlertId = 'demo-flood-001';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: mockAlertId }),
}));

function runtimeFor(feed: ShelterFeed, openDestination = jest.fn(async () => undefined), active: Alert[] = []): AppRuntime {
  return {
    alertService: { getFeed: async () => ({ active, recent: [], source: 'live', isOffline: false, retrievedAt: null }) },
    safetyResourceService: { getFeed: async () => feed },
    mapRoutingService: { openDestination },
    notificationPermissionService: { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
    analyticsService: { track: async () => undefined },
    plainLanguageService: { simplify: async (alert) => ({ summary: alert.summary, source: 'deterministic', reason: 'not-configured' }) },
    preferencesRepository: { get: async () => defaultPreferences, save: async () => undefined },
    checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
  };
}

describe('Safety Route screen', () => {
  it('clearly labels the demo destination and opens the simulated route', async () => {
    mockAlertId = 'demo-flood-001';
    const openDestination = jest.fn(async () => undefined);
    const screen = await render(<DisasterReadyProvider runtime={runtimeFor({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: null, radiusMiles: 100 }, openDestination)}><SafetyRouteScreen /></DisasterReadyProvider>);

    expect(screen.getByText('Simulated safety destination')).toBeTruthy();
    expect(screen.getByText('Demo only. This is not a real shelter.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open simulated safety route' }));

    expect(openDestination).toHaveBeenCalledWith({ label: 'Simulated safety destination', latitude: 30.2816, longitude: -97.7323 });
  });

  it('makes route categories interactive without inventing unsupported destinations', async () => {
    mockAlertId = 'demo-flood-001';
    const screen = await render(<DisasterReadyProvider runtime={runtimeFor({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: null, radiusMiles: 100 })}><SafetyRouteScreen /></DisasterReadyProvider>);

    await act(async () => {
      fireEvent.press(screen.getByRole('tab', { name: 'Higher ground' }));
    });

    await waitFor(() => expect(screen.getByText('No verified higher-ground destination source is connected')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Open simulated safety route' })).toBeNull();
  });

  it('does not offer a fabricated destination when no verified shelter is available', async () => {
    mockAlertId = 'real-alert-1';
    const realAlert: Alert = { ...demoFloodAlert, id: 'real-alert-1', providerId: 'real-alert-1', isDemo: false };
    const screen = await render(<DisasterReadyProvider runtime={runtimeFor({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: '2026-08-08T00:00:00.000Z', radiusMiles: 100 }, undefined, [realAlert])}><SafetyRouteScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByText('No verified shelter destination is available right now')).toBeTruthy());
    expect(screen.queryByText('Open Route')).toBeNull();
  });
});
