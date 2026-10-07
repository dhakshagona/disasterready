import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import * as Print from 'expo-print';

import { DisasterReadyProvider, type AppRuntime } from '@/application/app-context';
import ActionPlanScreen from '@/app/action-plan/[id]';
import { defaultPreferences, demoFloodPlan } from '@/data/mock-repositories';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'demo-flood-001' }),
}));

describe('action plan screen analytics', () => {
  it('separately records plan open, checklist start, and checklist completion in demo mode', async () => {
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
    const screen = await render(<DisasterReadyProvider runtime={runtime}><ActionPlanScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByText('Mark all done')).toBeTruthy());
    await waitFor(() => expect(track).toHaveBeenCalledWith('action_plan_opened', {
      mode: 'demo',
      properties: { hazard: 'flood', stepCount: demoFloodPlan.steps.length },
    }));

    fireEvent.press(screen.getByTestId(`action-step-${demoFloodPlan.steps[0]!.id}`));
    await waitFor(() => expect(track).toHaveBeenCalledWith('checklist_started', {
      mode: 'demo',
      properties: { hazard: 'flood', stepCount: demoFloodPlan.steps.length },
    }));

    fireEvent.press(screen.getByRole('button', { name: 'Mark all checklist steps done' }));
    await waitFor(() => expect(track).toHaveBeenCalledWith('checklist_completed', {
      mode: 'demo',
      properties: { hazard: 'flood', stepCount: demoFloodPlan.steps.length },
    }));
  });

  it('creates a PDF from the visible checklist action', async () => {
    const printToFile = jest.mocked(Print.printToFileAsync);
    printToFile.mockClear();
    const runtime: AppRuntime = {
      alertService: { getFeed: async () => ({ active: [], recent: [], source: 'live', isOffline: false, retrievedAt: null }) },
      safetyResourceService: { getFeed: async () => ({ shelters: [], source: 'live', isOffline: false, isStale: false, retrievedAt: null, radiusMiles: 100 }) },
      mapRoutingService: { openDestination: async () => undefined },
      notificationPermissionService: { getStatus: async () => 'unsupported', request: async () => 'unsupported' },
      analyticsService: { track: async () => undefined },
      plainLanguageService: { simplify: async (alert) => ({ summary: alert.summary, source: 'deterministic', reason: 'unsupported' }) },
      preferencesRepository: { get: async () => defaultPreferences, save: async () => undefined },
      checklistRepository: { getCompleted: async () => new Set(), setCompleted: async () => undefined },
    };
    const screen = await render(<DisasterReadyProvider runtime={runtime}><ActionPlanScreen /></DisasterReadyProvider>);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save or share checklist PDF' })).toBeTruthy());
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Save or share checklist PDF' }));
    });

    await waitFor(() => expect(printToFile).toHaveBeenCalledWith(expect.objectContaining({ html: expect.stringContaining('DisasterReady') })));
  });
});
