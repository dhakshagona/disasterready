import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { HomeFeedContent } from '@/features/home/home-feed-content';
import type { AlertFeed } from '@/application/alerts/live-alert-service';
import { demoFloodAlert } from '@/data/mock-repositories';

const callbacks = {
  onRefresh: jest.fn(async () => undefined),
  onOpenAlert: jest.fn(),
  onOpenPlan: jest.fn(),
  onOpenSafetyRoute: jest.fn(),
};

function makeFeed(overrides: Partial<AlertFeed> = {}): AlertFeed {
  return { active: [], recent: [], source: 'live', isOffline: false, retrievedAt: '2026-08-07T20:05:00.000Z', ...overrides };
}

describe('Home live alert content', () => {
  it('shows a truthful loading state while official alerts are being checked', async () => {
    const screen = await render(<HomeFeedContent feed={makeFeed()} isLoading isRefreshing={false} {...callbacks} />);
    expect(screen.getByText('Checking official alerts...')).toBeTruthy();
  });

  it('shows the all-clear scene only after a successful live response', async () => {
    const screen = await render(<HomeFeedContent feed={makeFeed()} isLoading={false} isRefreshing={false} {...callbacks} />);
    expect(screen.getByText('No Active Alerts')).toBeTruthy();
    expect(screen.getByText(/All clear/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh alert status' })).toBeTruthy();
  });

  it('does not claim all clear when live and cached data are unavailable', async () => {
    const screen = await render(<HomeFeedContent feed={makeFeed({ source: 'unavailable', isOffline: true, retrievedAt: null, error: 'Unavailable' })} isLoading={false} isRefreshing={false} {...callbacks} />);
    expect(screen.getByText('Alert status unavailable')).toBeTruthy();
    expect(screen.queryByText('No Active Alerts')).toBeNull();
  });

  it('prioritizes a real active alert and its core safety actions', async () => {
    const liveAlert = { ...demoFloodAlert, id: 'nws-live', isDemo: false, source: 'National Weather Service', doNow: demoFloodAlert.doNow };
    const screen = await render(<HomeFeedContent feed={makeFeed({ active: [liveAlert] })} isLoading={false} isRefreshing={false} {...callbacks} />);
    expect(screen.getByText('Flood Warning')).toBeTruthy();
    expect(screen.getByText('Safety Route')).toBeTruthy();
    expect(screen.getByText('Emergency Checklist')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safety Route' })).toBeTruthy();
  });
});
