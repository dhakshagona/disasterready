import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState, OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import type { Shelter } from '@/domain/models';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function distanceLabel(shelter: Shelter): string {
  return shelter.distanceMiles === undefined ? 'Distance unavailable' : `${shelter.distanceMiles.toFixed(1)} miles away`;
}

function ShelterCard({ shelter, onOpenMap }: { shelter: Shelter; onOpenMap(): void }) {
  return (
    <Card style={styles.shelterCard}>
      <View style={styles.shelterHeading}>
        <View style={styles.flex}>
          <AppText variant="heading">{shelter.name}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{distanceLabel(shelter)}</AppText>
        </View>
        <StatusBadge label={shelter.status === 'open' ? 'Reported open' : 'Status unknown'} tone={shelter.status === 'open' ? 'safe' : 'warning'} />
      </View>
      <View style={styles.detailRow}>
        <Icon name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} color={colors.primary} size={18} />
        <AppText variant="caption" style={styles.flex}>{shelter.address}</AppText>
      </View>
      {shelter.accessibilityNotes ? (
        <View style={styles.detailRow}>
          <Icon name={{ ios: 'figure.roll', android: 'accessible', web: 'accessible' }} color={colors.safe} size={18} />
          <AppText variant="caption" style={styles.flex}>{shelter.accessibilityNotes}</AppText>
        </View>
      ) : null}
      {shelter.petNotes ? <AppText variant="caption" color={colors.inkMuted}>Pets: {shelter.petNotes}</AppText> : null}
      {shelter.capacity !== undefined ? <AppText variant="caption" color={colors.inkMuted}>Reported evacuation capacity: {shelter.capacity}</AppText> : null}
      <SecondaryButton accessibilityLabel={`Open ${shelter.name} in maps`} onPress={onOpenMap}>Open in maps</SecondaryButton>
    </Card>
  );
}

export default function SheltersScreen() {
  const {
    isShelterLoading,
    loadSafetyResources,
    openShelterMap,
    preferences,
    shelterFeed,
  } = useDisasterReady();

  useEffect(() => {
    if (!shelterFeed) void loadSafetyResources();
  }, [loadSafetyResources, shelterFeed]);

  const location = preferences.location;
  const statusLabel = shelterFeed?.source === 'live' ? 'Live FEMA source' : shelterFeed?.source === 'cache' ? 'Saved FEMA data' : 'Source unavailable';

  return (
    <Screen testID="shelters-screen">
      <AppHeader
        title="Safety resources"
        subtitle={`${location.city}, ${location.region} ${location.postalCode}`}
        back
        trailing={
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh safety resources" disabled={isShelterLoading} onPress={() => void loadSafetyResources()} style={styles.refreshButton}>
            <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.primary} size={20} />
          </Pressable>
        }
      />

      {shelterFeed ? (
        <View style={styles.sourceRow}>
          <StatusBadge label={statusLabel} tone={shelterFeed.source === 'live' ? 'safe' : 'warning'} />
          {shelterFeed.retrievedAt ? <AppText variant="caption" color={colors.inkMuted}>Retrieved {formatTime(shelterFeed.retrievedAt)}</AppText> : null}
        </View>
      ) : null}

      {shelterFeed?.source === 'cache' && shelterFeed.retrievedAt ? <OfflineBanner lastUpdated={formatTime(shelterFeed.retrievedAt)} /> : null}
      {!shelterFeed || isShelterLoading ? <LoadingState label="Checking FEMA safety resources…" /> : null}
      {shelterFeed?.source === 'unavailable' && !isShelterLoading ? <ErrorState message={shelterFeed.error ?? 'FEMA shelter data is unavailable.'} /> : null}

      {shelterFeed?.source !== 'unavailable' && !isShelterLoading && shelterFeed?.shelters.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Icon name={{ ios: 'building.2.crop.circle', android: 'location_city', web: 'location_city' }} color={colors.primary} size={30} />
          </View>
          <AppText variant="heading" style={styles.center}>No FEMA-reported open shelters within {shelterFeed.radiusMiles} miles</AppText>
          <AppText color={colors.inkMuted} style={styles.center}>
            This is a live source result, not a guarantee that no local shelter exists. Follow local emergency-management instructions.
          </AppText>
        </Card>
      ) : null}

      {shelterFeed?.shelters.map((shelter) => (
        <ShelterCard key={shelter.id} shelter={shelter} onOpenMap={() => void openShelterMap(shelter)} />
      ))}

      <Card tone="muted" style={styles.sourceCard}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Official source</AppText>
        <AppText variant="bodyStrong">FEMA ESF #6 Shelter System</AppText>
        <AppText variant="caption" color={colors.inkMuted}>
          DisasterReady shows shelters reported by FEMA as open. Status, capacity, accessibility, and pet details can change. Confirm local instructions before traveling.
        </AppText>
        <SecondaryButton accessibilityLabel="Open FEMA shelter source" onPress={() => Linking.openURL('https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0')}>Open FEMA source</SecondaryButton>
      </Card>

      <Card tone="danger">
        <AppText variant="bodyStrong" color={colors.dangerStrong}>If you are in immediate danger</AppText>
        <AppText color={colors.dangerStrong}>Follow instructions from local officials and call emergency services when appropriate.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  refreshButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  sourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  emptyCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  iconCircle: { width: 58, height: 58, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  shelterCard: { gap: spacing.md },
  shelterHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sourceCard: { gap: spacing.sm },
});
