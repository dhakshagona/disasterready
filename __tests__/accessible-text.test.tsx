import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { StyleSheet } from 'react-native';

import { AccessibilityPreferencesProvider } from '@/components/accessibility/accessibility-preferences';
import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/tokens';

describe('AppText accessibility preferences', () => {
  it('applies the saved larger-text and high-contrast preferences', async () => {
    const screen = await render(
      <AccessibilityPreferencesProvider preferences={{ highContrast: true, reducedMotion: true, textSize: 'large' }}>
        <AppText color={colors.inkMuted} testID="accessible-copy">Readable copy</AppText>
      </AccessibilityPreferencesProvider>,
    );
    const style = StyleSheet.flatten(screen.getByTestId('accessible-copy').props.style);

    expect(style.fontSize).toBe(18);
    expect(style.lineHeight).toBe(25);
    expect(style.color).toBe(colors.ink);
  });
});
