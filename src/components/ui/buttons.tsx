import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, layout, radii, spacing } from '@/constants/tokens';

type ButtonProps = PropsWithChildren<PressableProps> & {
  loading?: boolean;
};

function ButtonContent({ children, loading, color }: PropsWithChildren<{ loading?: boolean; color: string }>) {
  return (
    <View style={styles.content}>
      {loading ? <ActivityIndicator color={color} /> : <AppText variant="bodyStrong" color={color}>{children}</AppText>}
    </View>
  );
}

export function PrimaryButton({ children, loading, disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        styles.primary,
        state.pressed && styles.primaryPressed,
        (disabled || loading) && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <ButtonContent loading={loading} color={colors.surface}>{children}</ButtonContent>
    </Pressable>
  );
}

export function SecondaryButton({ children, loading, disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        styles.secondary,
        state.pressed && styles.secondaryPressed,
        (disabled || loading) && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <ButtonContent loading={loading} color={colors.primary}>{children}</ButtonContent>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.5 },
  content: { minHeight: 24, alignItems: 'center', justifyContent: 'center' },
});
