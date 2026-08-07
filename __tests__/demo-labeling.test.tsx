import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { DemoBanner } from '@/components/ui/state-messages';

describe('demo labeling', () => {
  it('announces simulated data visibly', async () => {
    const screen = await render(<DemoBanner label="Demo Mode — Simulated Flood Warning" />);

    expect(screen.getByTestId('demo-banner')).toBeTruthy();
    expect(screen.getByText('Demo Mode — Simulated Flood Warning')).toBeTruthy();
  });
});
