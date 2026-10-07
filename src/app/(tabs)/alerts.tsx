import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useDisasterReady } from '@/application/app-context';
import { AlertCard } from '@/components/ui/alert-card';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState, LoadingState, OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

type Filter = 'current' | 'recent';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function AlertsScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const [filter, setFilter] = useState<Filter>('current');
  const { feed, preferences, isLoading, isRefreshing, refreshAlerts } = useDisasterReady();
  const isDemo = demo === '1';
  const alerts = isDemo ? (filter === 'current' ? [demoFloodAlert] : [demoExpiredAlert]) : (filter === 'current' ? feed.active : feed.recent);
  const tone = filter === 'current' && alerts.length > 0 ? 'alert' : 'default';

  return (
    <Screen tabScreen testID="alerts-screen" tone={tone}>
      <AppHeader
        title="Alerts"
        subtitle={`${preferences.location.city}, ${preferences.location.region} ${preferences.location.postalCode}`}
        trailing={
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh alerts" disabled={isRefreshing || isDemo} onPress={() => void refreshAlerts()} style={styles.headerAction}>
            <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.primary} size={20} />
          </Pressable>
        }
      />
      {isDemo ? <DemoBanner label="Demo: Simulated alert history" /> : null}
      {!isDemo && feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}

      <View style={styles.sourceRow}>
        <StatusBadge label={isDemo ? 'Simulated' : feed.source === 'live' ? 'Live NWS' : feed.source === 'cache' ? 'Saved data' : 'Unavailable'} tone={isDemo ? 'demo' : feed.source === 'live' ? 'safe' : 'warning'} />
        {!isDemo && feed.retrievedAt ? <AppText variant="caption" color={colors.inkMuted}>Updated {formatTime(feed.retrievedAt)}</AppText> : null}
      </View>

      <View accessibilityRole="tablist" style={styles.segmented}>
        {(['current', 'recent'] as Filter[]).map((value) => {
          const selected = filter === value;
          return (
            <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={[styles.segment, selected && styles.segmentSelected]}>
              <AppText variant="caption" color={selected ? colors.primary : colors.inkMuted}>{value === 'current' ? 'Current' : 'Recent'}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.resultsHeader}>
        <AppText variant="heading">{filter === 'current' ? 'Needs attention' : 'Recent history'}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}</AppText>
      </View>

      {!isDemo && isLoading ? <LoadingState label="Checking official alerts..." /> : null}
      {!isDemo && !isLoading && feed.source === 'unavailable' ? <ErrorState message={feed.error ?? 'Alert data is unavailable.'} /> : null}
      {(!isLoading || isDemo) && (isDemo || feed.source !== 'unavailable') && alerts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Icon name={{ ios: filter === 'current' ? 'checkmark.circle.fill' : 'clock', android: filter === 'current' ? 'check_circle' : 'schedule', web: filter === 'current' ? 'check_circle' : 'schedule' }} color={filter === 'current' ? colors.safe : colors.inkMuted} size={30} />
          </View>
          <AppText variant="heading">{filter === 'current' ? 'No active alerts' : 'No recent alerts saved'}</AppText>
          <AppText variant="caption" color={colors.inkMuted} style={styles.centerText}>{filter === 'current' ? 'Your selected area has no matching NWS alerts.' : 'Alerts that leave the active feed appear here for up to seven days.'}</AppText>
        </Card>
      ) : null}
      {(!isLoading || isDemo) ? alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onPress={() => router.push(`/alert/${alert.id}` as Href)} />) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, padding: 4, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.primarySoft },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  emptyCard: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.safeSoft },
  centerText: { textAlign: 'center' },
});
