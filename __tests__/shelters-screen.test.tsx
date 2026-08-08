import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import SheltersScreen from '@/app/shelters';
import { defaultPreferences } from '@/data/mock-repositories';
import type { ShelterFeed } from '@/application/safety-resources/safety-resource-service';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

function runtimeFor(feed: ShelterFeed, openDestination = jest.fn(async () => undefined)): AppRuntime {
  return {
    alertService: { getFeed: async () => ({ active: [], recent: [], source: 'live', isOffline: false, retrievedAt: '2026-08-08T00:00:00.000Z' }) },
    safetyResourceService: { getFeed: async () => feed },
    mapRoutingService: { openDestination },
    notificationPermissionService: { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
    preferencesRepository: { get: async () => defaultPreferences, save: async () => undefined },
    checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
  };
}

describe('safety resources screen', () => {
  it('shows a truthful live empty state from FEMA', async () => {
    const feed: ShelterFeed = {
      shelters: [],
      source: 'live',
      isOffline: false,
      isStale: false,
      retrievedAt: '2026-08-08T00:00:00.000Z',
      radiusMiles: 100,
    };
    const screen = await render(<DisasterReadyProvider runtime={runtimeFor(feed)}><SheltersScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByText('No FEMA-reported open shelters within 100 miles')).toBeTruthy());
    expect(screen.getByText('Live FEMA source')).toBeTruthy();
    expect(screen.queryByTestId('demo-banner')).toBeNull();
  });

  it('shows verified shelter details and opens the platform map adapter', async () => {
    const openDestination = jest.fn(async () => undefined);
    const feed: ShelterFeed = {
      shelters: [{
        id: 'fema-1',
        name: 'Official Shelter',
        status: 'open',
        address: '100 Main St, Austin, TX 78701',
        latitude: 30.27,
        longitude: -97.74,
        distanceMiles: 0.4,
        lastUpdatedAt: '2026-08-08T00:00:00.000Z',
        source: 'FEMA ESF #6 Shelter System',
        sourceUrl: 'https://gis.fema.gov/example',
        accessibilityNotes: 'ADA compliant: yes. Wheelchair accessible: unknown.',
        isVerified: true,
      }],
      source: 'live',
      isOffline: false,
      isStale: false,
      retrievedAt: '2026-08-08T00:00:00.000Z',
      radiusMiles: 100,
    };
    const screen = await render(<DisasterReadyProvider runtime={runtimeFor(feed, openDestination)}><SheltersScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByText('Official Shelter')).toBeTruthy());
    expect(screen.getByText('Reported open')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open Official Shelter in maps' }));

    expect(openDestination).toHaveBeenCalledWith({ latitude: 30.27, longitude: -97.74, label: 'Official Shelter' });
  });
});
