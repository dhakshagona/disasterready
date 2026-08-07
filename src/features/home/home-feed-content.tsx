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
  onOpenShelters(): void;
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function LoadingFeed() {
  return (
    <View style={[styles.scene, styles.loadingScene]} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} size="large" />
      <AppText variant="heading">Checking official alerts…</AppText>
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
      <SecondaryButton disabled={isRefreshing} onPress={() => void onRefresh()}>{isRefreshing ? 'Checking…' : 'Try again'}</SecondaryButton>
    </Card>
  );
}

function NoActiveAlerts({ feed, isRefreshing, onRefresh }: Pick<HomeFeedContentProps, 'feed' | 'isRefreshing' | 'onRefresh'>) {
  return (
    <>
      {feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}
      <View style={[styles.scene, styles.safeScene]}>
        <Image source={require('../../../assets/brand/lifebuoy.png')} style={styles.sceneArt} contentFit="contain" />
        <View style={styles.sceneCopy}>
          <View style={styles.statusLine}>
            <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} color={colors.safeStrong} size={20} />
            <AppText variant="heading" color={colors.safeStrong}>No active alerts</AppText>
          </View>
          <AppText variant="caption" color={colors.safeStrong} style={styles.centerText}>No matching NWS alerts are active for your selected area.</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh alert status" disabled={isRefreshing} onPress={() => void onRefresh()} style={styles.refreshPill}>
            {isRefreshing ? <ActivityIndicator color={colors.safeStrong} size="small" /> : <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.safeStrong} size={15} />}
            <AppText variant="caption" color={colors.safeStrong}>
              National Weather Service · {feed.retrievedAt ? `Updated ${formatTime(feed.retrievedAt)}` : 'Not yet updated'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function ActiveAlert({ alert, feed, onOpenAlert, onOpenPlan, onOpenShelters }: { alert: Alert } & Pick<HomeFeedContentProps, 'feed' | 'onOpenAlert' | 'onOpenPlan' | 'onOpenShelters'>) {
  return (
    <>
      {feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}
      <View style={[styles.scene, styles.dangerScene]}>
        <Image source={require('../../../assets/brand/lifebuoy.png')} style={styles.sceneArtSmall} contentFit="contain" />
        <View style={styles.sceneCopy}>
          <AppText variant="eyebrow" color={colors.dangerStrong}>{alert.severity} · {alert.urgency}</AppText>
          <AppText variant="title" color={colors.dangerStrong} style={styles.centerText}>{alert.headline}</AppText>
          <AppText variant="caption" color={colors.dangerStrong} style={styles.centerText}>{alert.areaDescription}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${alert.headline} details`} onPress={() => onOpenAlert(alert)} style={styles.alertPill}>
            <AppText variant="bodyStrong" color={colors.surface}>View alert</AppText>
            <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.surface} size={18} />
          </Pressable>
        </View>
      </View>
      <View style={styles.sourceLine}>
        <AppText variant="caption" color={colors.inkMuted}>{alert.source}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>Expires {formatTime(alert.expiresAt)}</AppText>
      </View>
      <Card style={styles.doNowCard}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Do these now</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Reviewed actions selected from structured alert fields</AppText>
        </View>
        {alert.doNow.length ? alert.doNow.map((step) => (
          <View key={step.id} style={styles.actionRow}>
            <View style={styles.actionNumber}><AppText variant="caption" color={colors.primary}>{step.priority}</AppText></View>
            <AppText variant="caption" style={styles.flex}>{step.title}</AppText>
          </View>
        )) : <AppText variant="caption" color={colors.inkMuted}>No reviewed plan matches this alert. Follow the original official instructions.</AppText>}
        {alert.doNow.length ? <SecondaryButton accessibilityLabel={`Open ${alert.hazard} safety checklist`} onPress={() => onOpenPlan(alert)}>Open safety checklist</SecondaryButton> : null}
      </Card>
      <Pressable accessibilityRole="button" accessibilityLabel="View verified safety resources" onPress={onOpenShelters} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
        <View style={styles.resourceIcon}><Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={colors.safe} size={22} /></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Verified safety resources</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Check verified source availability</AppText>
        </View>
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.inkSubtle} />
      </Pressable>
    </>
  );
}

export function HomeFeedContent(props: HomeFeedContentProps) {
  if (props.isLoading) return <LoadingFeed />;
  if (props.feed.source === 'unavailable') return <UnavailableFeed isRefreshing={props.isRefreshing} onRefresh={props.onRefresh} />;
  const primaryAlert = props.feed.active[0];
  if (!primaryAlert) return <NoActiveAlerts feed={props.feed} isRefreshing={props.isRefreshing} onRefresh={props.onRefresh} />;
  return <ActiveAlert alert={primaryAlert} feed={props.feed} onOpenAlert={props.onOpenAlert} onOpenPlan={props.onOpenPlan} onOpenShelters={props.onOpenShelters} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.68 },
  centerText: { textAlign: 'center' },
  scene: { minHeight: 318, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: spacing.xl, gap: spacing.md },
  loadingScene: { backgroundColor: colors.canvasStrong },
  safeScene: { backgroundColor: colors.safeWash },
  dangerScene: { backgroundColor: colors.dangerWash },
  sceneArt: { width: 178, height: 144 },
  sceneArtSmall: { width: 146, height: 116 },
  sceneCopy: { alignItems: 'center', gap: spacing.sm },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refreshPill: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.72)' },
  alertPill: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, borderRadius: radii.pill, backgroundColor: colors.danger },
  sourceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionHeading: { gap: spacing.xs },
  doNowCard: { gap: spacing.sm },
  actionRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  unavailableCard: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  dangerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  resourceCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  resourceIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.safeSoft, alignItems: 'center', justifyContent: 'center' },
});
