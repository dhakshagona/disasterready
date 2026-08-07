import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { AlertCard } from '@/components/ui/alert-card';
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

describe('AlertCard', () => {
  it('renders normalized alert content', async () => {
    const screen = await render(<AlertCard alert={demoFloodAlert} />);

    expect(screen.getByText('Flood Warning')).toBeTruthy();
    expect(screen.getByText('Austin, Texas 78701')).toBeTruthy();
    expect(screen.getByText('severe')).toBeTruthy();
  });

  it('distinguishes demo and expired alerts', async () => {
    const demoScreen = await render(<AlertCard alert={demoFloodAlert} />);
    expect(demoScreen.getByTestId('badge-demo')).toBeTruthy();

    const expiredScreen = await render(<AlertCard alert={demoExpiredAlert} />);
    expect(expiredScreen.getByText('Expired')).toBeTruthy();
  });
});
