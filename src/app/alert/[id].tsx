import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';

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
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getAlertById,
    isLoading,
    loadPlainLanguageSummary,
    plainLanguageResults,
    preferences,
  } = useDisasterReady();
  const alert = [demoFloodAlert, demoExpiredAlert].find((item) => item.id === id) ?? getAlertById(id);
  const plainLanguageResult = alert ? plainLanguageResults[alert.id] : undefined;

  useEffect(() => {
    if (alert && !alert.isDemo && preferences.plainLanguage) {
      void loadPlainLanguageSummary(alert);
    }
  }, [alert, loadPlainLanguageSummary, preferences.plainLanguage]);

  if (!alert) {
    return (
      <Screen>
        <AppHeader title="Alert details" back />
        {isLoading ? <LoadingState label="Loading alert details…" /> : <ErrorState message="This alert is no longer available in the live or saved alert feed." />}
        <SecondaryButton onPress={() => router.back()}>Return</SecondaryButton>
      </Screen>
    );
  }

  async function shareAlert() {
    await Share.share({ message: `${alert?.isDemo ? 'SIMULATED ' : ''}DISASTERREADY ALERT: ${alert?.headline} for ${alert?.areaDescription}. Source: ${alert?.source}.` });
  }

  return (
    <Screen testID="alert-detail-screen">
      <AppHeader title="Alert details" back trailing={<StatusBadge label={alert.status === 'active' ? 'Active' : 'Expired'} tone={alert.status === 'active' ? 'danger' : 'info'} />} />
      {alert.isDemo ? <DemoBanner label={`Demo · Simulated ${alert.headline}`} /> : null}
      {!alert.isDemo && alert.freshness !== 'current' ? <OfflineBanner lastUpdated={formatDate(alert.retrievedAt)} /> : null}

      <View style={[styles.hero, alert.status !== 'active' && styles.heroMuted]}>
        <Image source={require('../../../assets/brand/lifebuoy.png')} style={styles.heroArt} contentFit="contain" />
        <StatusBadge label={`${alert.severity} · ${alert.urgency}`} tone="danger" />
        <AppText variant="title" color={colors.dangerStrong} style={styles.centerText}>{alert.headline}</AppText>
        <AppText variant="caption" color={colors.dangerStrong} style={styles.centerText}>{alert.areaDescription}</AppText>
        <AppText color={colors.dangerStrong} style={styles.centerText}>{alert.summary}</AppText>
        {plainLanguageResult?.source === 'ai' ? (
          <View style={styles.plainLanguageCard}>
            <StatusBadge label="AI simplified" tone="info" />
            <AppText variant="bodyStrong" style={styles.centerText}>{plainLanguageResult.summary}</AppText>
            <AppText variant="caption" color={colors.inkMuted} style={styles.centerText}>
              Optional wording only. Official alert text and reviewed actions remain authoritative.
            </AppText>
          </View>
        ) : null}
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Do these now</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Follow these immediate safety actions in order.</AppText>
        </View>
        {alert.doNow.map((step) => (
          <View key={step.id} style={styles.actionRow}>
            <View style={styles.number}><AppText variant="caption" color={colors.primary}>{step.priority}</AppText></View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{step.title}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>{step.detail}</AppText>
            </View>
          </View>
        ))}
        {!alert.doNow.length ? <AppText variant="caption" color={colors.inkMuted}>No reviewed action-plan template matches this alert. Use the original official instructions below.</AppText> : null}
        {alert.status === 'active' && alert.doNow.length ? (
          <PrimaryButton accessibilityLabel={`Open ${alert.hazard} safety checklist`} onPress={() => router.push(`/action-plan/${alert.id}` as Href)}>Open safety checklist</PrimaryButton>
        ) : null}
      </Card>

      <Card style={styles.resourceCard}>
        <View style={styles.resourceIcon}><Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={colors.safe} size={22} /></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Verified safety resources</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Check FEMA-reported shelter availability and routing.</AppText>
        </View>
        <SecondaryButton accessibilityLabel="View verified safety resource status" onPress={() => router.push('/shelters' as Href)}>View</SecondaryButton>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Official alert text</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{alert.source}</AppText>
        </View>
        <AppText>{alert.originalText}</AppText>
        {alert.sourceUrl ? <SecondaryButton accessibilityLabel="Open original National Weather Service alert" onPress={() => Linking.openURL(alert.sourceUrl!)}>Open original NWS alert</SecondaryButton> : null}
        <View style={styles.metadata}>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Issued</AppText><AppText variant="caption">{formatDate(alert.issuedAt)}</AppText></View>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Expires</AppText><AppText variant="caption">{formatDate(alert.expiresAt)}</AppText></View>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Retrieved</AppText><AppText variant="caption">{formatDate(alert.retrievedAt)} · {alert.freshness}</AppText></View>
        </View>
      </Card>
      <SecondaryButton accessibilityLabel={`Share ${alert.isDemo ? 'simulated ' : ''}alert status`} onPress={shareAlert}>Share alert status</SecondaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerText: { textAlign: 'center' },
  flex: { flex: 1, gap: spacing.xs },
  hero: { minHeight: 330, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radii.xl, backgroundColor: colors.dangerWash },
  heroMuted: { backgroundColor: colors.surfaceMuted },
  heroArt: { width: 142, height: 114 },
  plainLanguageCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface },
  section: { gap: spacing.md },
  sectionHeading: { gap: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  resourceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resourceIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.safeSoft, alignItems: 'center', justifyContent: 'center' },
  metadata: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { gap: spacing.xs },
});
