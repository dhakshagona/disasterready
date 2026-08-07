import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { defaultPreferences, demoFloodAlert } from '@/data/mock-repositories';

type ShortcutProps = {
  icon: 'checklist' | 'verified_user' | 'menu_book';
  title: string;
  detail: string;
  tone?: 'primary' | 'safe';
  onPress?: () => void;
};

function Shortcut({ icon, title, detail, tone = 'primary', onPress }: ShortcutProps) {
  const accent = tone === 'safe' ? colors.safe : colors.primary;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.shortcutCard}>
        <View style={[styles.shortcutIcon, tone === 'safe' && styles.safeIcon]}>
          <Icon name={{ ios: icon === 'verified_user' ? 'checkmark.shield.fill' : icon === 'menu_book' ? 'book.fill' : 'checklist', android: icon, web: icon }} color={accent} size={22} />
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

function LocationHeader() {
  const { location } = defaultPreferences;
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

function NoAlertHome() {
  return (
    <>
      <View style={[styles.scene, styles.safeScene]}>
        <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.sceneArt} contentFit="contain" />
        <View style={styles.sceneCopy}>
          <View style={styles.statusLine}>
            <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} color={colors.safeStrong} size={20} />
            <AppText variant="heading" color={colors.safeStrong}>No active alerts</AppText>
          </View>
          <AppText variant="caption" color={colors.safeStrong} style={styles.centerText}>All clear for your selected area.</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh alert status" style={styles.refreshPill}>
            <Icon name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} color={colors.safeStrong} size={15} />
            <AppText variant="caption" color={colors.safeStrong}>Checked just now · Refresh</AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Ready when you need it</AppText>
        <Shortcut
          icon="checklist"
          title="Emergency checklist"
          detail="A quick 60-second flood preparation plan"
          onPress={() => router.push('/action-plan/demo-flood-plan-001' as Href)}
        />
        <Shortcut icon="menu_book" title="Stay prepared & up to date" detail="Review practical safety guidance before an emergency" tone="safe" />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Preview a simulated flood warning"
        onPress={() => router.setParams({ demo: '1' })}
        style={styles.demoLink}>
        <Icon name={{ ios: 'play.circle', android: 'play_circle', web: 'play_circle' }} color={colors.demo} size={18} />
        <AppText variant="caption" color={colors.demo}>Preview simulated flood warning</AppText>
      </Pressable>
    </>
  );
}

function DemoAlertHome() {
  return (
    <>
      <DemoBanner label="Demo · Simulated Flood Warning" />
      <View style={[styles.scene, styles.dangerScene]}>
        <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.sceneArtSmall} contentFit="contain" />
        <View style={styles.sceneCopy}>
          <AppText variant="title" color={colors.dangerStrong} style={styles.centerText}>{demoFloodAlert.headline}</AppText>
          <AppText variant="caption" color={colors.dangerStrong} style={styles.centerText}>{demoFloodAlert.areaDescription}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View flood warning details"
            onPress={() => router.push('/alert/demo-flood-001' as Href)}
            style={styles.alertPill}>
            <AppText variant="bodyStrong" color={colors.surface}>View alert</AppText>
            <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.surface} size={18} />
          </Pressable>
        </View>
      </View>

      <Card style={styles.doNowCard}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Do these now</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Immediate actions from the safety plan</AppText>
        </View>
        {demoFloodAlert.doNow.map((step) => (
          <View key={step.id} style={styles.actionRow}>
            <View style={styles.actionNumber}><AppText variant="caption" color={colors.primary}>{step.priority}</AppText></View>
            <AppText variant="caption" style={styles.flex}>{step.title}</AppText>
          </View>
        ))}
      </Card>

      <Shortcut
        icon="verified_user"
        title="Verified safety resources"
        detail="No live shelter source is connected; view source status"
        tone="safe"
        onPress={() => router.push('/shelters' as Href)}
      />
      <Shortcut
        icon="checklist"
        title="Emergency checklist"
        detail="Open the full step-by-step flood action plan"
        onPress={() => router.push('/action-plan/demo-flood-plan-001' as Href)}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="End demo mode" onPress={() => router.setParams({ demo: undefined })} style={styles.demoLink}>
        <AppText variant="caption" color={colors.demo}>End demo and return to all clear</AppText>
      </Pressable>
    </>
  );
}

export default function HomeScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  return (
    <Screen testID="home-screen">
      <LocationHeader />
      {demo === '1' ? <DemoAlertHome /> : <NoAlertHome />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.68 },
  centerText: { textAlign: 'center' },
  locationHeader: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scene: { minHeight: 318, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: spacing.xl, gap: spacing.md },
  safeScene: { backgroundColor: colors.safeWash },
  dangerScene: { backgroundColor: colors.dangerWash },
  sceneArt: { width: 178, height: 144 },
  sceneArtSmall: { width: 154, height: 124 },
  sceneCopy: { alignItems: 'center', gap: spacing.sm },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refreshPill: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.72)' },
  alertPill: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, borderRadius: radii.pill, backgroundColor: colors.danger },
  section: { gap: spacing.sm },
  sectionHeading: { gap: spacing.xs },
  shortcutCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shortcutIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  safeIcon: { backgroundColor: colors.safeSoft },
  demoLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  doNowCard: { gap: spacing.sm },
  actionRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
