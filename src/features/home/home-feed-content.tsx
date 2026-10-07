import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { AlertFeed } from '@/application/alerts/live-alert-service';
import { AppText } from '@/components/ui/app-text';
import { SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { OfflineBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import type { Alert } from '@/domain/models';

type HomeFeedContentProps = {
  feed: AlertFeed;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh(): Promise<void>;
  onOpenAlert(alert: Alert): void;
  onOpenPlan(alert: Alert): void;
  onOpenSafetyRoute(alert: Alert): void;
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function LoadingFeed() {
  return (
    <View style={styles.loadingScene} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} size="large" />
      <AppText variant="heading">Checking official alerts...</AppText>
      <AppText variant="caption" color={colors.inkMuted} style={styles.centerText}>Contacting the National Weather Service for your selected area.</AppText>
    </View>
  );
}

function UnavailableFeed({ isRefreshing, onRefresh }: Pick<HomeFeedContentProps, 'isRefreshing' | 'onRefresh'>) {
  return (
    <Card tone="danger" style={styles.unavailableCard}>
      <View style={styles.dangerIcon}><Icon name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }} color={colors.danger} size={24} /></View>
      <AppText variant="heading" color={colors.dangerStrong}>Alert status unavailable</AppText>
      <AppText color={colors.dangerStrong} style={styles.centerText}>We could not reach the National Weather Service and no saved alert data is available.</AppText>
      <SecondaryButton disabled={isRefreshing} onPress={() => void onRefresh()}>{isRefreshing ? 'Checking...' : 'Try again'}</SecondaryButton>
    </Card>
  );
}

function NoActiveAlerts({ feed, isRefreshing, onRefresh }: Pick<HomeFeedContentProps, 'feed' | 'isRefreshing' | 'onRefresh'>) {
  return (
    <>
      {feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}
      <View style={styles.safeScene}>
        <View style={styles.safeGlow}>
          <Image source={require('../../../assets/brand/lifebuoy-transparent.png')} style={styles.safeArt} contentFit="contain" />
        </View>
        <AppText variant="title" color={colors.safeStrong}>No Active Alerts</AppText>
        <AppText variant="caption" color={colors.safeStrong} style={styles.centerText}>All clear. Your selected area is safe.</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh alert status" disabled={isRefreshing} onPress={() => void onRefresh()} style={styles.refreshPill}>
          {isRefreshing ? <ActivityIndicator color={colors.safeStrong} size="small" /> : <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.safeStrong} size={15} />}
          <AppText variant="caption" color={colors.safeStrong}>{feed.retrievedAt ? `Updated ${formatTime(feed.retrievedAt)}` : 'Refresh alerts'}</AppText>
        </Pressable>
      </View>
    </>
  );
}

function ActionCard({ icon, title, detail, onPress }: { icon: 'route' | 'checklist'; title: string; detail: string; onPress(): void }) {
  const isRoute = icon === 'route';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.actionCard, isRoute ? styles.routeActionCard : styles.checklistActionCard]}>
        <View style={[styles.actionIcon, !isRoute && styles.checklistIcon]}>
          <Icon name={isRoute ? { ios: 'map.fill', android: 'map', web: 'map' } : { ios: 'checklist', android: 'checklist', web: 'checklist' }} color={isRoute ? colors.primary : '#A97708'} size={23} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{detail}</AppText>
        </View>
        <View style={[styles.actionArrow, isRoute ? styles.routeArrow : styles.checklistArrow]}>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={isRoute ? colors.surface : '#7A5606'} size={17} />
        </View>
      </Card>
    </Pressable>
  );
}

function ActiveAlert({ alert, feed, onOpenAlert, onOpenPlan, onOpenSafetyRoute }: { alert: Alert } & Pick<HomeFeedContentProps, 'feed' | 'onOpenAlert' | 'onOpenPlan' | 'onOpenSafetyRoute'>) {
  return (
    <>
      {feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}
      <View style={styles.alertScene}>
        <View style={styles.alertGlow}>
          <Image source={require('../../../assets/brand/lifebuoy-transparent.png')} style={styles.alertArt} contentFit="contain" />
        </View>
        <AppText variant="title" color={colors.dangerStrong} style={styles.centerText}>{alert.headline}</AppText>
        <AppText variant="caption" color={colors.dangerStrong} style={styles.centerText}>Within your selected alert area</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${alert.headline} details`} onPress={() => onOpenAlert(alert)} style={styles.alertPill}>
          <AppText variant="bodyStrong" color={colors.surface}>View Alert</AppText>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.surface} size={16} />
        </Pressable>
      </View>
      <View style={styles.actionStack}>
        <ActionCard icon="route" title="Safety Route" detail={alert.isDemo ? 'Find a simulated safety destination' : 'Check verified shelter availability'} onPress={() => onOpenSafetyRoute(alert)} />
        <ActionCard icon="checklist" title="Emergency Checklist" detail="Quick reviewed steps for this warning" onPress={() => onOpenPlan(alert)} />
      </View>
    </>
  );
}

export function HomeFeedContent(props: HomeFeedContentProps) {
  if (props.isLoading) return <LoadingFeed />;
  if (props.feed.source === 'unavailable') return <UnavailableFeed isRefreshing={props.isRefreshing} onRefresh={props.onRefresh} />;
  const primaryAlert = props.feed.active[0];
  if (!primaryAlert) return <NoActiveAlerts feed={props.feed} isRefreshing={props.isRefreshing} onRefresh={props.onRefresh} />;
  return <ActiveAlert alert={primaryAlert} feed={props.feed} onOpenAlert={props.onOpenAlert} onOpenPlan={props.onOpenPlan} onOpenSafetyRoute={props.onOpenSafetyRoute} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.68 },
  centerText: { textAlign: 'center' },
  loadingScene: { minHeight: 330, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  unavailableCard: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  dangerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  safeScene: { minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: spacing.sm },
  safeGlow: { width: 206, height: 178, alignItems: 'center', justifyContent: 'center', borderRadius: 103, backgroundColor: 'rgba(139, 231, 184, 0.20)' },
  safeArt: { width: 202, height: 164 },
  alertScene: { minHeight: 304, alignItems: 'center', justifyContent: 'center', gap: 7, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(239,62,87,0.13)', backgroundColor: 'rgba(255,255,255,0.30)', boxShadow: '0 8px 24px rgba(176,31,53,0.07)' },
  alertGlow: { width: 190, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 95, backgroundColor: 'rgba(239,62,87,0.13)' },
  alertArt: { width: 182, height: 142 },
  refreshPill: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.84)', borderWidth: 1, borderColor: 'rgba(8,113,75,0.10)', marginTop: 4 },
  alertPill: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 20, borderRadius: radii.pill, backgroundColor: colors.danger, marginTop: 5, boxShadow: '0 5px 14px rgba(176,31,53,0.22)' },
  actionStack: { gap: spacing.sm },
  actionCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  routeActionCard: { borderColor: '#BED2FA', backgroundColor: '#F9FBFF' },
  checklistActionCard: { borderColor: '#E8D9A8', backgroundColor: '#FFFEF9' },
  actionIcon: { width: 46, height: 46, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  checklistIcon: { backgroundColor: '#FFF7D9' },
  actionArrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  routeArrow: { backgroundColor: colors.primary },
  checklistArrow: { backgroundColor: '#FFF0B8' },
});
