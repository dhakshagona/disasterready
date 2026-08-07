import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { DemoBanner, OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { defaultPreferences, hazardLabels } from '@/data/mock-repositories';

export default function SettingsScreen() {
  const [plainLanguage, setPlainLanguage] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [offlinePreview, setOfflinePreview] = useState(false);

  return (
    <Screen testID="settings-screen">
      <AppHeader title="Settings" subtitle="Guest profile • saved on this device later" />
      {offlinePreview ? <OfflineBanner lastUpdated="3:02 PM" /> : null}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><AppText variant="heading" color={colors.primary}>G</AppText></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Guest mode</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Emergency information stays accessible without signing in.</AppText>
        </View>
        <StatusBadge label="Local" tone="info" />
      </Card>
      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Location & hazards</AppText>
        <Card>
          <AppText variant="bodyStrong">{defaultPreferences.location.city}, {defaultPreferences.location.region} {defaultPreferences.location.postalCode}</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Saved location • prototype only</AppText>
          <View style={styles.chips}>
            {defaultPreferences.hazards.map((hazard) => <StatusBadge key={hazard} label={hazardLabels[hazard]} tone="info" />)}
          </View>
        </Card>
      </View>
      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Accessibility</AppText>
        <Card>
          <SettingRow label="Plain language" detail="Shorter, more direct summaries" value={plainLanguage} onValueChange={setPlainLanguage} />
          <SettingRow label="High contrast" detail="Stronger visual separation" value={highContrast} onValueChange={setHighContrast} />
          <SettingRow label="Larger text" detail="Use the larger reading preset" value={largeText} onValueChange={setLargeText} />
        </Card>
      </View>
      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Language</AppText>
        <Card style={styles.row}>
          <AppText variant="bodyStrong" style={styles.flex}>English</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Spanish translation planned</AppText>
        </Card>
      </View>
      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Prototype tools</AppText>
        <DemoBanner label="Demo alerts never count as real alerts or notifications" />
        <Card>
          <SettingRow label="Preview offline state" detail="Shows how cached-data freshness will be disclosed" value={offlinePreview} onValueChange={setOfflinePreview} />
        </Card>
      </View>
      <Card tone="muted">
        <AppText variant="bodyStrong">Data & privacy</AppText>
        <AppText variant="caption" color={colors.inkMuted}>No account, location history, push token, or cloud profile exists in Phase 1.</AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  section: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
