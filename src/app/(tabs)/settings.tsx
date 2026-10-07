import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SettingRow } from '@/components/ui/setting-row';
import { OfflineBanner } from '@/components/ui/state-messages';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';
import { hazardLabels } from '@/data/mock-repositories';

function ValueRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card style={styles.valueRow}>
      <AppText variant="bodyStrong" style={styles.flex}>{label}</AppText>
      <View style={styles.valueContent}>{children}</View>
    </Card>
  );
}

export default function SettingsScreen() {
  const { feed, isNotificationPermissionLoading, notificationPermissionState, preferences, requestNotificationPermission, updatePreferences } = useDisasterReady();
  const [offlinePreview, setOfflinePreview] = useState(false);
  const location = preferences.location;
  const showOffline = offlinePreview || (feed.isOffline && Boolean(feed.retrievedAt));
  const savedAt = feed.retrievedAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(feed.retrievedAt)) : '3:02 PM (preview)';

  const save = <Key extends keyof typeof preferences>(key: Key, value: (typeof preferences)[Key]) => {
    void updatePreferences({ ...preferences, [key]: value });
  };

  const notificationStatus = {
    unsupported: 'Unavailable on web',
    'not-determined': 'Not requested',
    denied: 'Denied',
    granted: 'Allowed',
    provisional: 'Provisional',
    ephemeral: 'Temporary',
    error: 'Unavailable',
  }[notificationPermissionState ?? 'error'];

  return (
    <Screen tabScreen testID="settings-screen">
      <AppHeader title="Settings" subtitle="Manage your settings" />
      {showOffline ? <OfflineBanner lastUpdated={savedAt} /> : null}

      <Card style={styles.profileCard}>
        <View style={styles.avatar}><Icon name={{ ios: 'person.fill', android: 'person', web: 'person' }} color={colors.ink} size={20} /></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Guest profile</AppText>
          <AppText variant="caption" color={colors.inkMuted}>Stored on this device</AppText>
        </View>
        <Icon name={{ ios: 'pencil', android: 'edit', web: 'edit' }} color={colors.inkMuted} size={18} />
      </Card>

      <ValueRow label="Hazards">
        <View style={styles.chips}>{preferences.hazards.slice(0, 2).map((hazard) => <StatusBadge key={hazard} label={hazardLabels[hazard]} tone="info" />)}{preferences.hazards.length > 2 ? <StatusBadge label={`+${preferences.hazards.length - 2}`} tone="info" /> : null}</View>
      </ValueRow>
      <ValueRow label="Location"><StatusBadge label={`${location.city}, ${location.region} ${location.postalCode}`} tone="info" /></ValueRow>
      <ValueRow label="Language"><StatusBadge label="English" tone="info" /></ValueRow>
      <ValueRow label="Text size"><StatusBadge label={preferences.textSize === 'standard' ? 'Standard' : preferences.textSize === 'large' ? 'Large' : 'Extra large'} tone="info" /></ValueRow>

      <Card style={styles.settingCard}>
        <SettingRow label="High contrast" value={preferences.highContrast} onValueChange={(value) => save('highContrast', value)} />
        <SettingRow accessibilityLabel="Plain language" label="Simple words" value={preferences.plainLanguage} onValueChange={(value) => save('plainLanguage', value)} />
        <SettingRow label="Larger text" value={preferences.textSize !== 'standard'} onValueChange={(value) => save('textSize', value ? 'large' : 'standard')} />
        <SettingRow label="Reduced motion" value={preferences.reducedMotion} onValueChange={(value) => save('reducedMotion', value)} />
        <SettingRow label="Preview offline state" value={offlinePreview} onValueChange={setOfflinePreview} />
      </Card>

      <Card style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}><Icon name={{ ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications_active' }} color={colors.primary} size={20} /></View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Emergency notifications</AppText>
            <AppText variant="caption" color={colors.inkMuted}>{isNotificationPermissionLoading ? 'Checking permission' : notificationStatus}</AppText>
          </View>
        </View>
        {notificationPermissionState === 'unsupported' ? <AppText variant="caption" color={colors.inkMuted}>Install the iOS or Android development build to request system notification permission.</AppText> : null}
        {notificationPermissionState === 'not-determined' ? <PrimaryButton accessibilityLabel="Enable emergency notifications" loading={isNotificationPermissionLoading} onPress={() => void requestNotificationPermission()}>Enable notifications</PrimaryButton> : null}
      </Card>

      <Card tone="muted" style={styles.privacyCard}>
        <Icon name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }} color={colors.safe} size={21} />
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
  profileCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  valueRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  valueContent: { maxWidth: '68%', alignItems: 'flex-end' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 5 },
  settingCard: { paddingTop: 0, paddingBottom: 0 },
  notificationCard: { gap: spacing.md },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notificationIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  privacyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
