import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { colors, spacing } from '@/constants/tokens';

export function DemoBanner({ label = 'Demo Mode — Simulated alert' }: { label?: string }) {
  return (
    <View accessibilityRole="alert" style={[styles.banner, styles.demo]} testID="demo-banner">
      <Icon name={{ ios: 'sparkles', android: 'science', web: 'science' }} color={colors.demo} size={18} />
      <AppText variant="caption" color={colors.demo} style={styles.flex}>{label}</AppText>
    </View>
  );
}

export function OfflineBanner({ lastUpdated }: { lastUpdated: string }) {
  return (
    <View accessibilityRole="alert" style={[styles.banner, styles.offline]}>
      <Icon name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }} color={colors.warning} size={18} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={colors.warning}>Offline</AppText>
        <AppText variant="caption" color={colors.inkMuted}>Showing cached data from {lastUpdated}. It may be stale.</AppText>
      </View>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card style={styles.centered}>
      <View style={styles.iconCircle}>
        <Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={colors.safe} size={28} />
      </View>
      <AppText variant="heading" accessibilityRole="header">{title}</AppText>
      <AppText color={colors.inkMuted} style={styles.centerText}>{message}</AppText>
    </Card>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <AppText color={colors.inkMuted}>{label}</AppText>
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card tone="danger">
      <AppText variant="bodyStrong" color={colors.dangerStrong}>Unable to load</AppText>
      <AppText color={colors.inkMuted}>{message}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 14 },
  demo: { backgroundColor: colors.demoSoft, borderWidth: 1, borderColor: '#D8C8F2' },
  offline: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#E8CF81' },
  flex: { flex: 1 },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.safeSoft, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  loading: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
