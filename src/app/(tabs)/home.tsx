import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import type { AlertFeed } from '@/application/alerts/live-alert-service';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoFloodAlert } from '@/data/mock-repositories';
import type { Alert, SavedLocation } from '@/domain/models';
import { HomeFeedContent } from '@/features/home/home-feed-content';

type ShortcutProps = {
  icon: 'checklist' | 'menu_book';
  title: string;
  detail: string;
  tone?: 'primary' | 'safe';
  onPress?: () => void;
};

function Shortcut({ icon, title, detail, tone = 'primary', onPress }: ShortcutProps) {
  const accent = tone === 'safe' ? colors.safe : colors.primary;
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={title} disabled={!onPress} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.shortcutCard}>
        <View style={[styles.shortcutIcon, tone === 'safe' && styles.safeIcon]}>
          <Icon name={{ ios: icon === 'menu_book' ? 'book.fill' : 'checklist', android: icon, web: icon }} color={accent} size={22} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{detail}</AppText>
        </View>
        {onPress ? <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.inkSubtle} /> : null}
      </Card>
    </Pressable>
  );
}

function LocationHeader({ location }: { location: SavedLocation }) {
  return (
    <View style={styles.locationHeader}>
      <AppText variant="title" accessibilityRole="header">Good afternoon</AppText>
      <View style={styles.locationLine}>
        <Icon name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} color={colors.primary} size={16} />
        <AppText variant="caption" color={colors.inkMuted}>{location.city}, {location.region} {location.postalCode}</AppText>
      </View>
    </View>
  );
}

const demoFeed: AlertFeed = {
  active: [demoFloodAlert],
  recent: [],
  source: 'live',
  isOffline: false,
  retrievedAt: demoFloodAlert.retrievedAt,
};

export default function HomeScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const { feed, preferences, isLoading, isRefreshing, refreshAlerts, trackEvent } = useDisasterReady();
  const isDemo = demo === '1';
  const demoTrackedRef = useRef(false);
  const shownFeed = isDemo ? demoFeed : feed;
  const openAlert = (alert: Alert) => router.push(`/alert/${alert.id}` as Href);
  const openPlan = (alert: Alert) => router.push(`/action-plan/${alert.id}` as Href);
  const showPreparedness = !isDemo && !isLoading && feed.source !== 'unavailable' && feed.active.length === 0;

  useEffect(() => {
    if (isDemo && !demoTrackedRef.current) {
      demoTrackedRef.current = true;
      void trackEvent('demo_session_started', { mode: 'demo', properties: { hazard: 'flood', entry: 'home' } });
    }
    if (!isDemo) demoTrackedRef.current = false;
  }, [isDemo, trackEvent]);

  return (
    <Screen testID="home-screen">
      <LocationHeader location={preferences.location} />
      {isDemo ? <DemoBanner label="Demo · Simulated Flood Warning" /> : null}
      <HomeFeedContent
        feed={shownFeed}
        isLoading={isDemo ? false : isLoading}
        isRefreshing={isDemo ? false : isRefreshing}
        onRefresh={refreshAlerts}
        onOpenAlert={openAlert}
        onOpenPlan={openPlan}
        onOpenShelters={() => router.push('/shelters' as Href)}
      />

      {showPreparedness ? (
        <View style={styles.section}>
          <AppText variant="eyebrow" color={colors.inkMuted}>Ready when you need it</AppText>
          <Shortcut icon="checklist" title="Preview emergency checklist" detail="Try the reviewed flood safety plan in demo mode" onPress={() => router.push('/action-plan/demo-flood-001' as Href)} />
          <Shortcut icon="menu_book" title="Stay prepared & up to date" detail="Review practical safety guidance before an emergency" tone="safe" />
        </View>
      ) : null}

      {isDemo ? (
        <Pressable accessibilityRole="button" accessibilityLabel="End demo mode" onPress={() => router.setParams({ demo: undefined })} style={styles.demoLink}>
          <AppText variant="caption" color={colors.demo}>End demo and return to live alerts</AppText>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Preview a simulated flood warning" onPress={() => router.setParams({ demo: '1' })} style={styles.demoLink}>
          <Icon name={{ ios: 'play.circle', android: 'play_circle', web: 'play_circle' }} color={colors.demo} size={18} />
          <AppText variant="caption" color={colors.demo}>Preview simulated flood warning</AppText>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.68 },
  locationHeader: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.sm },
  shortcutCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shortcutIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  safeIcon: { backgroundColor: colors.safeSoft },
  demoLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
