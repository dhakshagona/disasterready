import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { router } from 'expo-router';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import type { NotificationPermissionAdapter } from '@/application/notifications/notification-permission-service';
import AccessibilityScreen from '@/app/onboarding/accessibility';
import SettingsScreen from '@/app/(tabs)/settings';
import { defaultPreferences } from '@/data/mock-repositories';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
}));

jest.setTimeout(15_000);

function makeRuntime(
  save: (preferences: typeof defaultPreferences) => Promise<void>,
  notificationPermissionService: NotificationPermissionAdapter = { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
): AppRuntime {
  return {
    alertService: {
      getFeed: async () => ({
        active: [],
        recent: [],
        source: 'live',
        isOffline: false,
        retrievedAt: '2026-08-07T20:05:00.000Z',
      }),
    },
    safetyResourceService: { getFeed: async () => ({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: '2026-08-08T00:00:00.000Z', radiusMiles: 100 }) },
    mapRoutingService: { openDestination: async () => undefined },
    notificationPermissionService,
    analyticsService: { track: async () => undefined },
    plainLanguageService: { simplify: async (alert) => ({ summary: alert.summary, source: 'deterministic', reason: 'not-configured' }) },
    preferencesRepository: {
      get: async () => ({
        ...defaultPreferences,
        plainLanguage: false,
        location: { ...defaultPreferences.location, city: 'Houston', region: 'TX', postalCode: '77002' },
      }),
      save,
    },
    checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
  };
}

describe('preference screens', () => {
  it('shows persisted settings and saves accessibility changes', async () => {
    const save = jest.fn(async () => undefined);
    const screen = await render(
      <DisasterReadyProvider runtime={makeRuntime(save)}>
        <SettingsScreen />
      </DisasterReadyProvider>,
    );

    await waitFor(() => expect(screen.queryByText('Houston, TX 77002')).not.toBeNull(), { timeout: 1500 });
    expect(screen.getByRole('switch', { name: 'Plain language' }).props.accessibilityState).toEqual({ checked: false });

    fireEvent.press(screen.getByRole('switch', { name: 'Plain language' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ plainLanguage: true })));
  });

  it('persists onboarding accessibility selections before finishing setup', async () => {
    const save = jest.fn(async () => undefined);
    const screen = await render(
      <DisasterReadyProvider runtime={makeRuntime(save)}>
        <AccessibilityScreen />
      </DisasterReadyProvider>,
    );

    await waitFor(() => expect(screen.getByRole('switch', { name: 'Plain language' }).props.accessibilityState).toEqual({ checked: false }));
    fireEvent.press(screen.getByRole('switch', { name: 'High contrast' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'High contrast' }).props.accessibilityState.checked).toBe(true));
    fireEvent.press(screen.getByRole('button', { name: 'Finish setup and open home' }));

    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ highContrast: true })));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/home'));
  });

  it('does not describe unavailable data as cached when no saved response exists', async () => {
    const runtime = makeRuntime(async () => undefined);
    runtime.alertService = {
      getFeed: async () => ({
        active: [],
        recent: [],
        source: 'unavailable',
        isOffline: true,
        retrievedAt: null,
        error: 'No live or saved alert data is available.',
      }),
    };
    const screen = await render(
      <DisasterReadyProvider runtime={runtime}>
        <SettingsScreen />
      </DisasterReadyProvider>,
    );

    await waitFor(() => expect(screen.queryByText('Houston, TX 77002')).not.toBeNull());
    expect(screen.queryByText(/Showing cached data/)).toBeNull();
  });

  it('shows the explicit web fallback for notification permissions', async () => {
    const screen = await render(
      <DisasterReadyProvider runtime={makeRuntime(async () => undefined)}>
        <SettingsScreen />
      </DisasterReadyProvider>,
    );

    await waitFor(() => expect(screen.getByText('Unavailable on web')).toBeTruthy());
    expect(screen.getByText('Install the iOS or Android development build to request system notification permission.')).toBeTruthy();
  });

  it('requests native notification permission and persists the granted preference', async () => {
    const save = jest.fn(async () => undefined);
    const permissionService = {
      getStatus: async () => 'not-determined' as const,
      request: async () => 'granted' as const,
    };
    const screen = await render(
      <DisasterReadyProvider runtime={makeRuntime(save, permissionService)}>
        <SettingsScreen />
      </DisasterReadyProvider>,
    );

    await waitFor(() => expect(screen.getByText('Not requested')).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Enable emergency notifications' }));
    });

    await waitFor(() => expect(screen.getByText('Allowed')).toBeTruthy());
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ notificationsEnabled: true }));
  });
});
