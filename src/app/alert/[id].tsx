import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoExpiredAlert, demoFloodAlert } from '@/data/mock-repositories';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = [demoFloodAlert, demoExpiredAlert].find((item) => item.id === id);

  if (!alert) {
    return (
      <Screen>
        <AppHeader title="Alert details" back />
        <ErrorState message="This local demo alert could not be found." />
        <SecondaryButton onPress={() => router.back()}>Return</SecondaryButton>
      </Screen>
    );
  }

  async function shareAlert() {
    await Share.share({
      message: `SIMULATED DISASTERREADY ALERT: ${alert?.headline} for ${alert?.areaDescription}. Open DisasterReady for the reviewed demo action plan.`,
    });
  }

  return (
    <Screen testID="alert-detail-screen">
      <AppHeader title="Alert details" back trailing={<StatusBadge label={alert.status === 'active' ? 'Active' : 'Expired'} tone={alert.status === 'active' ? 'danger' : 'info'} />} />
      {alert.isDemo ? <DemoBanner label={`Demo Mode — Simulated ${alert.headline}`} /> : null}
      <Card tone={alert.status === 'active' ? 'danger' : 'muted'} style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <View style={styles.iconCircle}>
            <Icon name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }} color={colors.surface} size={25} />
          </View>
          <View style={styles.flex}>
            <AppText variant="title" color={colors.dangerStrong}>{alert.headline}</AppText>
            <AppText variant="caption" color={colors.dangerStrong}>{alert.areaDescription}</AppText>
          </View>
        </View>
        <AppText color={colors.dangerStrong}>{alert.summary}</AppText>
        <View style={styles.badges}>
          <StatusBadge label={alert.severity} tone="danger" />
          <StatusBadge label={alert.urgency} tone="warning" />
          <StatusBadge label={alert.certainty} tone="info" />
        </View>
      </Card>
      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Do now</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Reviewed prototype actions selected deterministically</AppText>
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
        {alert.status === 'active' ? (
          <PrimaryButton accessibilityLabel="Start full flood action plan" onPress={() => router.push('/action-plan/demo-flood-plan-001' as Href)}>Start full action plan</PrimaryButton>
        ) : null}
      </Card>
      <SecondaryButton accessibilityLabel="Find verified safety resources" onPress={() => router.push('/shelters' as Href)}>Find verified safety resources</SecondaryButton>
      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="heading">Official alert text</AppText>
          <AppText variant="caption" color={colors.inkMuted}>{alert.source}</AppText>
        </View>
        <AppText>{alert.originalText}</AppText>
        <View style={styles.metadata}>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Issued</AppText><AppText variant="caption">{formatDate(alert.issuedAt)}</AppText></View>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Expires</AppText><AppText variant="caption">{formatDate(alert.expiresAt)}</AppText></View>
          <View style={styles.metaItem}><AppText variant="eyebrow" color={colors.inkSubtle}>Retrieved</AppText><AppText variant="caption">{formatDate(alert.retrievedAt)} • {alert.freshness}</AppText></View>
        </View>
      </Card>
      <SecondaryButton accessibilityLabel="Share simulated alert status" onPress={shareAlert}>Share simulated status</SecondaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg, borderColor: '#F2B8B2' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionHeading: { gap: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  metadata: { gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { gap: spacing.xs },
});
