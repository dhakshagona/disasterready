import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState, LoadingState, OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoFloodAlert } from '@/data/mock-repositories';
import type { Shelter } from '@/domain/models';

const demoSafetyDestination: Shelter = {
  id: 'demo-safety-destination',
  name: 'Simulated safety destination',
  status: 'open',
  address: 'Demo route in Austin, Texas',
  latitude: 30.2816,
  longitude: -97.7323,
  distanceMiles: 1.2,
  lastUpdatedAt: demoFloodAlert.retrievedAt,
  source: 'DisasterReady demo mode',
  sourceUrl: '',
  accessibilityNotes: 'Simulation only. Confirm real destinations with local officials.',
  isVerified: false,
};

type RouteCategory = 'shelter' | 'higher-ground' | 'evacuation';

const routeCategories: { label: string; value: RouteCategory }[] = [
  { label: 'Shelter', value: 'shelter' },
  { label: 'Higher ground', value: 'higher-ground' },
  { label: 'Evacuation', value: 'evacuation' },
];

function RouteFooter({ destination, isDemo, onOpen }: { destination: Shelter; isDemo: boolean; onOpen(): void }) {
  return (
    <PrimaryButton accessibilityLabel={isDemo ? 'Open simulated safety route' : `Open route to ${destination.name}`} onPress={onOpen}>
      Open Route
    </PrimaryButton>
  );
}

export default function SafetyRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAlertById, isShelterLoading, loadSafetyResources, openShelterMap, shelterFeed } = useDisasterReady();
  const [category, setCategory] = useState<RouteCategory>('shelter');
  const alert = id === demoFloodAlert.id ? demoFloodAlert : getAlertById(id);
  const isDemo = Boolean(alert?.isDemo);
  const verifiedShelters = shelterFeed?.shelters.filter((shelter) => shelter.isVerified && shelter.status === 'open') ?? [];
  const destination = category === 'shelter' ? isDemo ? demoSafetyDestination : verifiedShelters[0] : undefined;

  useEffect(() => {
    if (!isDemo && !shelterFeed) void loadSafetyResources();
  }, [isDemo, loadSafetyResources, shelterFeed]);

  if (!alert && !isDemo) {
    return (
      <Screen>
        <AppHeader title="Safety Route" back />
        <ErrorState message="This alert is no longer available." />
      </Screen>
    );
  }

  return (
    <Screen
      testID="safety-route-screen"
      footer={destination ? <RouteFooter destination={destination} isDemo={isDemo} onOpen={() => void openShelterMap(destination)} /> : undefined}>
      <AppHeader title="Safety Route" subtitle={alert?.headline ?? 'Active alert'} back />
      {isDemo ? <DemoBanner label="Demo: Simulated safety destination" /> : null}
      {!isDemo && shelterFeed?.source === 'cache' && shelterFeed.retrievedAt ? <OfflineBanner lastUpdated={new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(shelterFeed.retrievedAt))} /> : null}

      <View accessibilityRole="tablist" style={styles.routeTabs}>
        {routeCategories.map((item) => {
          const selected = item.value === category;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setCategory(item.value)}
              style={({ pressed }) => [styles.routeTab, selected && styles.routeTabSelected, pressed && styles.routeTabPressed]}>
              <AppText variant="caption" color={selected ? colors.primary : colors.inkMuted}>{item.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {category !== 'shelter' ? (
        <Card style={styles.unavailableCategoryCard}>
          <View style={styles.emptyIcon}><Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={colors.safe} size={28} /></View>
          <AppText variant="heading" style={styles.center}>No verified {category === 'higher-ground' ? 'higher-ground' : 'evacuation'} destination source is connected</AppText>
          <AppText variant="caption" color={colors.inkMuted} style={styles.center}>DisasterReady will not guess a destination. Use verified shelter results or follow directions from local emergency officials.</AppText>
        </Card>
      ) : null}

      {isDemo && category === 'shelter' ? (
        <View style={styles.mapWrap}>
          <Image source={require('../../../assets/brand/safety-route-demo.png')} style={styles.map} contentFit="cover" />
          <View style={styles.mapLabel}><AppText variant="eyebrow" color={colors.demo}>Simulated route preview</AppText></View>
        </View>
      ) : null}

      {!isDemo && category === 'shelter' && (!shelterFeed || isShelterLoading) ? <LoadingState label="Checking verified shelter destinations..." /> : null}
      {!isDemo && category === 'shelter' && shelterFeed?.source === 'unavailable' && !isShelterLoading ? <ErrorState message="Verified FEMA shelter data is unavailable. No route destination will be shown." /> : null}

      {!isDemo && category === 'shelter' && shelterFeed?.source !== 'unavailable' && !isShelterLoading && !destination ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Icon name={{ ios: 'map.fill', android: 'map', web: 'map' }} color={colors.primary} size={28} /></View>
          <AppText variant="heading" style={styles.center}>No verified shelter destination is available right now</AppText>
          <AppText variant="caption" color={colors.inkMuted} style={styles.center}>DisasterReady will not create or guess a shelter. Follow local emergency instructions and check the official FEMA source again.</AppText>
          <SecondaryButton onPress={() => void loadSafetyResources()}>Check again</SecondaryButton>
        </Card>
      ) : null}

      {destination ? (
        <Card style={styles.destinationCard}>
          <View style={styles.destinationTop}>
            <View style={styles.destinationIcon}>
              <Icon name={{ ios: isDemo ? 'location.fill' : 'checkmark.shield.fill', android: isDemo ? 'location_on' : 'verified_user', web: isDemo ? 'location_on' : 'verified_user' }} color={isDemo ? colors.primary : colors.safe} size={22} />
            </View>
            <View style={styles.flex}>
              <View style={styles.titleLine}>
                <AppText variant="heading">{destination.name}</AppText>
                <StatusBadge label={isDemo ? 'Simulated' : 'Verified'} tone={isDemo ? 'demo' : 'safe'} />
              </View>
              <AppText variant="caption" color={colors.inkMuted}>{destination.address}</AppText>
            </View>
          </View>
          {isDemo ? <AppText variant="bodyStrong" color={colors.dangerStrong}>Demo only. This is not a real shelter.</AppText> : null}
          <View style={styles.routeFacts}>
            <View><AppText variant="eyebrow" color={colors.inkSubtle}>Distance</AppText><AppText variant="bodyStrong">{destination.distanceMiles?.toFixed(1) ?? 'Unknown'} mi</AppText></View>
            <View><AppText variant="eyebrow" color={colors.inkSubtle}>Source</AppText><AppText variant="bodyStrong">{isDemo ? 'Demo mode' : 'FEMA'}</AppText></View>
          </View>
        </Card>
      ) : null}

      {!isDemo && category === 'shelter' ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/shelters' as Href)} style={styles.allSheltersLink}>
          <AppText variant="caption" color={colors.primary}>View all verified shelter results</AppText>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.primary} size={16} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  routeTabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: radii.md, backgroundColor: colors.surface },
  routeTab: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  routeTabSelected: { backgroundColor: colors.primarySoft },
  routeTabPressed: { opacity: 0.68 },
  mapWrap: { height: 330, borderRadius: radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  map: { width: '100%', height: '100%' },
  mapLabel: { position: 'absolute', top: spacing.sm, left: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.92)' },
  emptyCard: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  unavailableCategoryCard: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  destinationCard: { gap: spacing.md },
  destinationTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  destinationIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  routeFacts: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  allSheltersLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
