import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
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
      <AppHeader title="Settings" subtitle="Guest profile" />
      {offlinePreview ? <OfflineBanner lastUpdated="3:02 PM" /> : null}

      <Card style={styles.profileCard}>
        <View style={styles.avatar}><AppText variant="heading" color={colors.primary}>G</AppText></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Guest mode</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Use emergency information without signing in.</AppText>
        </View>
        <StatusBadge label="Local" tone="info" />
      </Card>

      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Location & hazards</AppText>
        <Card style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.iconBox}><Icon name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} color={colors.primary} size={20} /></View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{defaultPreferences.location.city}, {defaultPreferences.location.region} {defaultPreferences.location.postalCode}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>Your selected alert area</AppText>
            </View>
          </View>
          <View style={styles.chips}>
            {defaultPreferences.hazards.map((hazard) => <StatusBadge key={hazard} label={hazardLabels[hazard]} tone="info" />)}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Accessibility</AppText>
        <Card style={styles.settingCard}>
          <SettingRow label="Plain language" detail="Shorter, more direct summaries" value={plainLanguage} onValueChange={setPlainLanguage} />
          <SettingRow label="High contrast" detail="Stronger visual separation" value={highContrast} onValueChange={setHighContrast} />
          <SettingRow label="Larger text" detail="Use the larger reading preset" value={largeText} onValueChange={setLargeText} />
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Language</AppText>
        <Card style={styles.languageRow}>
          <View style={styles.iconBox}><Icon name={{ ios: 'globe', android: 'language', web: 'language' }} color={colors.primary} size={20} /></View>
          <AppText variant="bodyStrong" style={styles.flex}>English</AppText>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.inkSubtle} />
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Demo & offline</AppText>
        <DemoBanner label="Simulated alerts are always clearly labeled" />
        <Card style={styles.settingCard}>
          <SettingRow label="Preview offline state" detail="See cached-data freshness messaging" value={offlinePreview} onValueChange={setOfflinePreview} />
        </Card>
      </View>

      <Card tone="muted" style={styles.privacyCard}>
        <Icon name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }} color={colors.safe} size={22} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Data & privacy</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Guest mode does not create a cloud profile.</AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.sm },
  locationCard: { gap: spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  settingCard: { paddingTop: 0, paddingBottom: 0 },
  languageRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  privacyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
