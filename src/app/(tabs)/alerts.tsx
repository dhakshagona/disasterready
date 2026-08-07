import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AlertCard } from '@/components/ui/alert-card';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { DemoBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

type Filter = 'current' | 'recent';

export default function AlertsScreen() {
  const [filter, setFilter] = useState<Filter>('current');
  const alerts = filter === 'current' ? [demoFloodAlert] : [demoExpiredAlert];

  return (
    <Screen testID="alerts-screen">
      <AppHeader title="Alerts" subtitle="Austin, TX 78701" />
      <DemoBanner label="Demo · Simulated alerts" />
      <View accessibilityRole="tablist" style={styles.segmented}>
        {(['current', 'recent'] as Filter[]).map((value) => {
          const selected = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(value)}
              style={[styles.segment, selected && styles.segmentSelected]}>
              <AppText variant="caption" color={selected ? colors.primary : colors.inkMuted}>
                {value === 'current' ? 'Current' : 'Recent'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.resultsHeader}>
        <AppText variant="heading">{filter === 'current' ? 'Needs attention' : 'Recent history'}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{alerts.length} alert</AppText>
      </View>
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onPress={() => router.push(`/alert/${alert.id}` as Href)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: radii.md },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
