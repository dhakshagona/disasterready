import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';

export default function SheltersScreen() {
  return (
    <Screen testID="shelters-screen">
      <AppHeader title="Safety resources" subtitle="Austin, TX 78701" back />
      <DemoBanner label="Demo Mode — no real shelter lookup is connected" />
      <Card style={styles.emptyCard}>
        <View style={styles.iconCircle}>
          <Icon name={{ ios: 'building.2.crop.circle', android: 'location_city', web: 'location_city' }} color={colors.primary} size={30} />
        </View>
        <AppText variant="heading" style={styles.center}>No verified open shelter available</AppText>
        <AppText color={colors.inkMuted} style={styles.center}>
          DisasterReady will not invent a location or label a shelter “open” without a source that supports that claim.
        </AppText>
      </Card>
      <Card tone="muted" style={styles.notes}>
        <AppText variant="eyebrow" color={colors.inkMuted}>What this screen will require</AppText>
        <View style={styles.noteRow}><View style={styles.dot} /><AppText style={styles.flex}>Verified status and source</AppText></View>
        <View style={styles.noteRow}><View style={styles.dot} /><AppText style={styles.flex}>Address, distance, last updated time, and accessibility details</AppText></View>
        <View style={styles.noteRow}><View style={styles.dot} /><AppText style={styles.flex}>Apple Maps or Google Maps handoff for directions</AppText></View>
      </Card>
      <Card tone="danger">
        <AppText variant="bodyStrong" color={colors.dangerStrong}>If you are in immediate danger</AppText>
        <AppText color={colors.dangerStrong}>Follow instructions from local officials and call emergency services when appropriate.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  iconCircle: { width: 64, height: 64, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  notes: { gap: spacing.md },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dot: { width: 8, height: 8, marginTop: 8, borderRadius: 4, backgroundColor: colors.primary },
  flex: { flex: 1 },
});
