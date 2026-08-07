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
      <DemoBanner label="Demo Mode — all alerts on this screen are simulated" />
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
                {value === 'current' ? 'Current' : 'Recent / expired'}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.resultsHeader}>
        <AppText variant="heading">{filter === 'current' ? 'Needs attention' : 'Recent history'}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{alerts.length} simulated alert</AppText>
      </View>
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onPress={() => router.push(`/alert/${alert.id}` as Href)} />
      ))}
      <AppText variant="caption" color={colors.inkSubtle}>
        In Phase 2, alerts will be normalized from the National Weather Service and filtered by location and selected hazards.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: radii.md },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  resultsHeader: { gap: spacing.xs },
});
