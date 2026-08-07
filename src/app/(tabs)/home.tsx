import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionStepRow } from '@/components/ui/action-step-row';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, EmptyState } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';

function LocationHeader() {
  const location = defaultPreferences.location;
  return (
    <View style={styles.locationHeader}>
      <View style={styles.brandMark}>
        <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.brandImage} />
      </View>
      <View style={styles.headerCopy}>
        <AppText variant="caption" color={colors.inkMuted}>Your location</AppText>
        <AppText variant="bodyStrong">{location.city}, {location.region} {location.postalCode}</AppText>
      </View>
      <View accessibilityLabel="Guest profile" style={styles.avatar}><AppText variant="caption" color={colors.primary}>G</AppText></View>
    </View>
  );
}

function NoAlertHome() {
  return (
    <>
      <EmptyState
        title="No active alerts"
        message="No simulated alerts are active for Austin right now. Live data is not connected in this phase."
      />
      <View style={styles.freshnessRow}>
        <Icon name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} color={colors.inkMuted} size={16} />
        <AppText variant="caption" color={colors.inkMuted}>Prototype state • Last checked just now</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh alert preview" style={styles.refresh}>
          <AppText variant="caption" color={colors.primary}>Refresh</AppText>
        </Pressable>
      </View>
      <Card style={styles.demoCallout}>
        <View style={styles.demoIcon}><Icon name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} color={colors.demo} /></View>
        <View style={styles.headerCopy}>
          <AppText variant="bodyStrong">See the complete emergency flow</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Try a clearly labeled simulated flood warning.</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start flood warning demo"
          onPress={() => router.setParams({ demo: '1' })}
          style={styles.inlineButton}>
          <AppText variant="caption" color={colors.demo}>Start demo</AppText>
        </Pressable>
      </Card>
      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Prepare ahead</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Small steps, less stress later.</AppText>
        </View>
        <Card style={styles.shortcutCard}>
          <View style={styles.shortcutIcon}><Icon name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }} color={colors.primary} /></View>
          <View style={styles.headerCopy}>
            <AppText variant="bodyStrong">Flood preparedness checklist</AppText>
            <AppText variant="caption" color={colors.inkMuted}>5 reviewed prototype steps</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open flood preparedness checklist" onPress={() => router.push('/action-plan/demo-flood-plan-001' as Href)}>
            <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.inkMuted} />
          </Pressable>
        </Card>
        <Card style={styles.shortcutCard}>
          <View style={[styles.shortcutIcon, styles.safeIcon]}><Icon name={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }} color={colors.safe} /></View>
          <View style={styles.headerCopy}>
            <AppText variant="bodyStrong">Plan a family check-in</AppText>
            <AppText variant="caption" color={colors.inkMuted}>Feature planned for a later phase</AppText>
          </View>
        </Card>
      </View>
    </>
  );
}

function DemoAlertHome() {
  return (
    <>
      <DemoBanner label="Demo Mode — Simulated Flood Warning" />
      <Card tone="danger" style={styles.alertHero}>
        <View style={styles.alertTopline}>
          <StatusBadge label="Severe • Immediate" tone="danger" />
          <AppText variant="caption" color={colors.dangerStrong}>Expires 6:45 PM</AppText>
        </View>
        <View style={styles.alertTitleRow}>
          <View style={styles.dangerIcon}>
            <Icon name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }} color={colors.surface} size={25} />
          </View>
          <View style={styles.headerCopy}>
            <AppText variant="title" color={colors.dangerStrong}>{demoFloodAlert.headline}</AppText>
            <AppText variant="caption" color={colors.dangerStrong}>{demoFloodAlert.areaDescription}</AppText>
          </View>
        </View>
        <AppText color={colors.dangerStrong}>{demoFloodAlert.summary}</AppText>
      </Card>
      <Card style={styles.doNowCard}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Do now</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Top actions from the reviewed demo plan</AppText>
        </View>
        {demoFloodAlert.doNow.map((step) => (
          <ActionStepRow key={step.id} step={step} completed={false} compact onToggle={() => undefined} />
        ))}
        <PrimaryButton accessibilityLabel="Start flood action plan" onPress={() => router.push('/action-plan/demo-flood-plan-001' as Href)}>
          Start action plan
        </PrimaryButton>
      </Card>
      <SecondaryButton accessibilityLabel="Find verified safety resources" onPress={() => router.push('/shelters' as Href)}>
        Find verified safety resources
      </SecondaryButton>
      <Pressable accessibilityRole="button" accessibilityLabel="View original simulated alert" onPress={() => router.push('/alert/demo-flood-001' as Href)} style={styles.textLink}>
        <AppText variant="bodyStrong" color={colors.primary}>View alert details and original text</AppText>
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.primary} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="End demo mode" onPress={() => router.setParams({ demo: undefined })} style={styles.endDemo}>
        <AppText variant="caption" color={colors.demo}>End demo and return to no-alert state</AppText>
      </Pressable>
    </>
  );
}

export default function HomeScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  return (
    <Screen testID="home-screen">
      <LocationHeader />
      <View style={styles.welcome}>
        <AppText variant="title" accessibilityRole="header">Good afternoon</AppText>
        <AppText color={colors.inkMuted}>{demo === '1' ? 'Here is what needs your attention.' : 'You are all clear in this prototype.'}</AppText>
      </View>
      {demo === '1' ? <DemoAlertHome /> : <NoAlertHome />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandMark: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.canvasStrong, alignItems: 'center', justifyContent: 'center' },
  brandImage: { width: 42, height: 34 },
  headerCopy: { flex: 1, gap: spacing.xs },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#B9D5F2', alignItems: 'center', justifyContent: 'center' },
  welcome: { gap: spacing.xs, paddingTop: spacing.sm },
  freshnessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refresh: { marginLeft: 'auto', minHeight: 44, justifyContent: 'center' },
  demoCallout: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: '#D8C8F2' },
  demoIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.demoSoft, alignItems: 'center', justifyContent: 'center' },
  inlineButton: { minHeight: 44, justifyContent: 'center' },
  section: { gap: spacing.md },
  sectionHeading: { gap: spacing.xs },
  shortcutCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shortcutIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  safeIcon: { backgroundColor: colors.safeSoft },
  alertHero: { gap: spacing.lg, borderColor: '#F2B8B2' },
  alertTopline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dangerIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  doNowCard: { gap: spacing.md },
  textLink: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  endDemo: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
