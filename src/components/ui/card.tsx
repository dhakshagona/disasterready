import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/tokens';

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
  return (
    <View
      style={[styles.base, { backgroundColor: toneColors[tone] }, padded && styles.padded, style]}
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
  padded: { padding: spacing.lg },
});
