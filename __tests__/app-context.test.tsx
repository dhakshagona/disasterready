import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DisasterReadyProvider, type AppRuntime, useDisasterReady } from '@/application/app-context';
import { defaultPreferences } from '@/data/mock-repositories';

function Probe() {
  const { feed, isLoading, preferences, refreshAlerts, updatePreferences } = useDisasterReady();
  return (
    <>
      <Text testID="state">{`${isLoading}:${feed.source}:${preferences.location.city}`}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={refreshAlerts} />
      <Pressable accessibilityRole="button" accessibilityLabel="Select tornado" onPress={() => updatePreferences({ ...preferences, hazards: ['tornado'] })} />
    </>
  );
}

describe('DisasterReady application context', () => {
  it('loads persisted preferences, retrieves alerts, and saves preference updates', async () => {
    const persisted = { ...defaultPreferences, location: { ...defaultPreferences.location, city: 'Houston' } };
    const save = jest.fn(async () => undefined);
    const getFeed = jest.fn(async () => ({
      active: [],
      recent: [],
      source: 'live' as const,
      isOffline: false,
      retrievedAt: '2026-08-07T20:05:00.000Z',
    }));
    const runtime: AppRuntime = {
      alertService: { getFeed },
      preferencesRepository: { get: async () => persisted, save },
      checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
    };
    const screen = await render(<DisasterReadyProvider runtime={runtime}><Probe /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('false:live:Houston'));
    expect(getFeed).toHaveBeenCalledWith(persisted);

    fireEvent.press(screen.getByRole('button', { name: 'Select tornado' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ hazards: ['tornado'] })));
  });

  it('falls back to default preferences when local preference storage is unavailable', async () => {
    const getFeed = jest.fn(async () => ({
      active: [],
      recent: [],
      source: 'live' as const,
      isOffline: false,
      retrievedAt: '2026-08-07T20:05:00.000Z',
    }));
    const runtime: AppRuntime = {
      alertService: { getFeed },
      preferencesRepository: {
        get: async () => { throw new Error('storage unavailable'); },
        save: async () => undefined,
      },
      checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
    };
    const screen = await render(<DisasterReadyProvider runtime={runtime}><Probe /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('false:live:Austin'));
    expect(getFeed).toHaveBeenCalledWith(defaultPreferences);
  });
});
