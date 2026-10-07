import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAccessibilityPreferences } from '@/components/accessibility/accessibility-preferences';
import { colors, radii, shadows } from '@/constants/tokens';

type CardProps = PropsWithChildren<ViewProps> & {
  tone?: 'default' | 'danger' | 'safe' | 'muted';
  padded?: boolean;
};

const toneColors = {
  default: colors.surface,
  danger: colors.dangerSoft,
  safe: colors.safeSoft,
  muted: colors.surfaceMuted,
};

export function Card({ children, tone = 'default', padded = true, style, ...props }: CardProps) {
  const { highContrast } = useAccessibilityPreferences();

  return (
    <View
      style={[styles.base, { backgroundColor: toneColors[tone] }, highContrast && styles.highContrast, padded && styles.padded, style]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadows.card ?? {}),
  },
  highContrast: { borderColor: colors.inkMuted, borderWidth: 2 },
  padded: { padding: 14 },
});
