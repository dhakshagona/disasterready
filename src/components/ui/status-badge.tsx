import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radii, spacing } from '@/constants/tokens';

type StatusBadgeProps = {
  label: string;
  tone?: 'danger' | 'safe' | 'warning' | 'info' | 'demo';
};

const badgeTones = {
  danger: { background: colors.dangerSoft, foreground: colors.dangerStrong },
  safe: { background: colors.safeSoft, foreground: colors.safeStrong },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  info: { background: colors.primarySoft, foreground: colors.primaryPressed },
  demo: { background: colors.demoSoft, foreground: colors.demo },
};

export function StatusBadge({ label, tone = 'info' }: StatusBadgeProps) {
  const palette = badgeTones[tone];
  return (
    <View
      accessibilityLabel={label}
      style={[styles.badge, { backgroundColor: palette.background }]}
      testID={`badge-${tone}`}>
      <AppText variant="caption" color={palette.foreground} style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
