import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

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
  const accent = tone === 'safe' ? colors.safe : '#C58B08';
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={title} disabled={!onPress} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.shortcutCard}>
        <View style={[styles.shortcutIcon, tone === 'safe' ? styles.safeIcon : styles.checklistIcon]}>
          <Icon name={{ ios: icon === 'menu_book' ? 'book.fill' : 'checklist', android: icon, web: icon }} color={accent} size={21} />
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
      <AppText variant="title" accessibilityRole="header">Welcome back</AppText>
      <View style={styles.locationLine}>
        <Icon name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} color={colors.primary} size={15} />
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

const clearDemoFeed: AlertFeed = {
  active: [],
  recent: [],
  source: 'live',
  isOffline: false,
  retrievedAt: demoFloodAlert.retrievedAt,
};

export default function HomeScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const { feed, preferences, isLoading, isRefreshing, refreshAlerts, trackEvent } = useDisasterReady();
  const isAlertDemo = demo === '1';
  const isClearDemo = demo === 'clear';
  const isDemo = isAlertDemo || isClearDemo;
  const sessionTrackedRef = useRef(false);
  const demoTrackedRef = useRef(false);
  const shownFeed = isAlertDemo ? demoFeed : isClearDemo ? clearDemoFeed : feed;
  const openAlert = (alert: Alert) => router.push(`/alert/${alert.id}` as Href);
  const openPlan = (alert: Alert) => router.push(`/action-plan/${alert.id}` as Href);
  const openSafetyRoute = (alert: Alert) => router.push(`/safety-route/${alert.id}` as Href);
  const showPreparedness = isClearDemo || (!isDemo && !isLoading && feed.source !== 'unavailable' && feed.active.length === 0);
  const tone = shownFeed.active.length > 0 ? 'alert' : 'calm';

  useEffect(() => {
    if (!sessionTrackedRef.current) {
      sessionTrackedRef.current = true;
      void trackEvent('session_started', { mode: isDemo ? 'demo' : 'real' });
    }
    if (isAlertDemo && !demoTrackedRef.current) {
      demoTrackedRef.current = true;
      void trackEvent('demo_session_started', { mode: 'demo', properties: { hazard: 'flood', entry: 'home' } });
    }
    if (!isAlertDemo) demoTrackedRef.current = false;
  }, [isAlertDemo, isDemo, trackEvent]);

  return (
    <Screen tabScreen testID="home-screen" tone={tone}>
      <LocationHeader location={preferences.location} />
      {isDemo ? <DemoBanner label={isAlertDemo ? 'Demo: Simulated Flood Warning' : 'Demo: All-clear state'} /> : null}
      <HomeFeedContent
        feed={shownFeed}
        isLoading={isDemo ? false : isLoading}
        isRefreshing={isDemo ? false : isRefreshing}
        onRefresh={refreshAlerts}
        onOpenAlert={openAlert}
        onOpenPlan={openPlan}
        onOpenSafetyRoute={openSafetyRoute}
      />

      {showPreparedness ? (
        <View style={styles.section}>
          <Shortcut icon="checklist" title="Emergency Checklist" detail="Review quick emergency steps" onPress={() => router.push('/action-plan/demo-flood-001' as Href)} />
          <Shortcut icon="menu_book" title="Stay prepared & up to date" detail="Open official Ready.gov guidance" tone="safe" onPress={() => void Linking.openURL('https://www.ready.gov')} />
        </View>
      ) : null}

      {isDemo ? (
        <Pressable accessibilityRole="button" accessibilityLabel="End demo mode" onPress={() => router.setParams({ demo: undefined })} style={styles.demoLink}>
          <AppText variant="caption" color={colors.demo}>End demo</AppText>
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
  locationHeader: { alignItems: 'center', gap: 2, paddingTop: spacing.xs },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.sm },
  shortcutCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shortcutIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  checklistIcon: { backgroundColor: '#FFF7D9' },
  safeIcon: { backgroundColor: colors.safeSoft },
  demoLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
