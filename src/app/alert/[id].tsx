import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState, LoadingState, OfflineBanner } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function DetailAction({ icon, title, detail, onPress, tone }: { icon: 'map' | 'checklist'; title: string; detail: string; onPress(): void; tone: 'blue' | 'yellow' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.actionCard}>
        <View style={[styles.actionIcon, tone === 'yellow' && styles.yellowIcon]}>
          <Icon name={icon === 'map' ? { ios: 'map.fill', android: 'map', web: 'map' } : { ios: 'checklist', android: 'checklist', web: 'checklist' }} color={tone === 'blue' ? colors.primary : '#C58B08'} size={21} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{detail}</AppText>
        </View>
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.ink} size={17} />
      </Card>
    </Pressable>
  );
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAlertById, isLoading, loadPlainLanguageSummary, plainLanguageResults, preferences } = useDisasterReady();
  const alert = [demoFloodAlert, demoExpiredAlert].find((item) => item.id === id) ?? getAlertById(id);
  const plainLanguageResult = alert ? plainLanguageResults[alert.id] : undefined;

  useEffect(() => {
    if (alert && !alert.isDemo && preferences.plainLanguage) void loadPlainLanguageSummary(alert);
  }, [alert, loadPlainLanguageSummary, preferences.plainLanguage]);

  if (!alert) {
    return (
      <Screen>
        <AppHeader title="Alert Detail" back />
        {isLoading ? <LoadingState label="Loading alert details..." /> : <ErrorState message="This alert is no longer available in the live or saved alert feed." />}
        <SecondaryButton onPress={() => router.back()}>Return</SecondaryButton>
      </Screen>
    );
  }

  async function shareAlert() {
    await Share.share({ message: `${alert?.isDemo ? 'SIMULATED ' : ''}DISASTERREADY ALERT: ${alert?.headline} for ${alert?.areaDescription}. Source: ${alert?.source}.` });
  }

  const route = `/safety-route/${alert.id}` as Href;
  const checklist = `/action-plan/${alert.id}` as Href;

  return (
    <Screen
      testID="alert-detail-screen"
      tone={alert.status === 'active' ? 'alert' : 'default'}
      footer={alert.status === 'active' ? <PrimaryButton accessibilityLabel={`Find Safety Route for ${alert.headline}`} onPress={() => router.push(route)}>Find Safety Route</PrimaryButton> : undefined}>
      <AppHeader title="Alert Detail" subtitle={alert.status === 'active' ? `Expires ${formatDate(alert.expiresAt)}` : 'Expired alert'} back />
      {alert.isDemo ? <DemoBanner label={`Demo: Simulated ${alert.headline}`} /> : null}
      {!alert.isDemo && alert.freshness !== 'current' ? <OfflineBanner lastUpdated={formatDate(alert.retrievedAt)} /> : null}

      <View style={[styles.alertPanel, alert.status !== 'active' && styles.alertPanelMuted]}>
        <Image source={require('../../../assets/brand/lifebuoy-transparent.png')} style={styles.heroArt} contentFit="contain" />
        <View style={styles.heroCopy}>
          <AppText variant="title" color={colors.surface}>{alert.headline}</AppText>
          <AppText variant="bodyStrong" color={colors.surface}>{alert.areaDescription}</AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.90)">{alert.severity} severity. {alert.urgency} action.</AppText>
        </View>
      </View>

      {alert.status === 'active' ? (
        <View style={styles.actionStack}>
          <DetailAction icon="map" title="Safety Route" detail={alert.isDemo ? 'Simulated destination, clearly labeled' : 'Verified shelter destinations only'} tone="blue" onPress={() => router.push(route)} />
          {alert.doNow.length ? <DetailAction icon="checklist" title="Emergency Checklist" detail="Quick reviewed preparation steps" tone="yellow" onPress={() => router.push(checklist)} /> : null}
        </View>
      ) : null}

      <Card style={styles.officialCard}>
        <AppText variant="bodyStrong">Official text ({alert.isDemo ? 'simulated NWS' : 'NWS'})</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{alert.originalText}</AppText>
        {plainLanguageResult?.source === 'ai' ? (
          <View style={styles.simpleCopy}>
            <AppText variant="eyebrow" color={colors.primary}>AI simplified</AppText>
            <AppText variant="caption">{plainLanguageResult.summary}</AppText>
          </View>
        ) : null}
        {alert.sourceUrl ? <SecondaryButton accessibilityLabel="Open original National Weather Service alert" onPress={() => Linking.openURL(alert.sourceUrl!)}>Open original NWS alert</SecondaryButton> : null}
      </Card>

      <Card style={styles.reviewedActions}>
        <AppText variant="bodyStrong">Reviewed immediate actions</AppText>
        {alert.doNow.length ? alert.doNow.map((step) => (
          <View key={step.id} style={styles.reviewedRow}>
            <View style={styles.stepNumber}><AppText variant="caption" color={colors.primary}>{step.priority}</AppText></View>
            <AppText variant="caption" style={styles.flex}>{step.title}</AppText>
          </View>
        )) : <AppText variant="caption" color={colors.inkMuted}>No reviewed plan matches this alert. Follow the original official instructions.</AppText>}
      </Card>

      <Card style={styles.resourceInfo}>
        <Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={colors.safe} size={21} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Verified safety resources</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Check FEMA-reported shelter availability and routing.</AppText>
        </View>
      </Card>

      <SecondaryButton accessibilityLabel={`Share ${alert.isDemo ? 'simulated ' : ''}alert status`} onPress={shareAlert}>Share with family</SecondaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.68 },
  alertPanel: { minHeight: 150, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.dangerPanel },
  alertPanelMuted: { backgroundColor: colors.demo },
  heroArt: { width: 92, height: 84 },
  heroCopy: { flex: 1, gap: spacing.xs },
  actionStack: { gap: spacing.sm },
  actionCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  yellowIcon: { backgroundColor: '#FFF7D9' },
  officialCard: { gap: spacing.sm },
  simpleCopy: { gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primarySoft },
  reviewedActions: { gap: spacing.sm },
  reviewedRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepNumber: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  resourceInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
