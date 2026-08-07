import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useDisasterReady } from '@/application/app-context';
import { AlertCard } from '@/components/ui/alert-card';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState, OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';

type Filter = 'current' | 'recent';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function AlertsScreen() {
  const [filter, setFilter] = useState<Filter>('current');
  const { feed, preferences, isLoading, isRefreshing, refreshAlerts } = useDisasterReady();
  const alerts = filter === 'current' ? feed.active : feed.recent;

  return (
    <Screen testID="alerts-screen">
      <AppHeader
        title="Alerts"
        subtitle={`${preferences.location.city}, ${preferences.location.region} ${preferences.location.postalCode}`}
        trailing={
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh alerts" disabled={isRefreshing} onPress={() => void refreshAlerts()} style={styles.headerAction}>
            <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.primary} size={20} />
          </Pressable>
        }
      />
      {feed.isOffline && feed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(feed.retrievedAt)} /> : null}
      <View style={styles.sourceRow}>
        <StatusBadge label={feed.source === 'live' ? 'Live NWS' : feed.source === 'cache' ? 'Saved data' : 'Unavailable'} tone={feed.source === 'live' ? 'safe' : 'warning'} />
        {feed.retrievedAt ? <AppText variant="caption" color={colors.inkMuted}>Updated {formatTime(feed.retrievedAt)}</AppText> : null}
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
      {isLoading ? <LoadingState label="Checking official alerts…" /> : null}
      {!isLoading && feed.source === 'unavailable' ? <ErrorState message={feed.error ?? 'Alert data is unavailable.'} /> : null}
      {!isLoading && feed.source !== 'unavailable' && alerts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Icon name={{ ios: filter === 'current' ? 'checkmark.circle.fill' : 'clock', android: filter === 'current' ? 'check_circle' : 'schedule', web: filter === 'current' ? 'check_circle' : 'schedule' }} color={filter === 'current' ? colors.safe : colors.inkMuted} size={28} />
          <AppText variant="bodyStrong">{filter === 'current' ? 'No matching active alerts' : 'No recent alerts saved'}</AppText>
          <AppText variant="caption" color={colors.inkMuted} style={styles.centerText}>{filter === 'current' ? 'The latest NWS response has no alerts matching your selected hazards.' : 'Alerts that leave the active feed will appear here for up to seven days.'}</AppText>
        </Card>
      ) : null}
      {!isLoading ? alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onPress={() => router.push(`/alert/${alert.id}` as Href)} />) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  sourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: radii.md },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  emptyCard: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  centerText: { textAlign: 'center' },
});
