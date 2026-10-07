import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDisasterReady } from '@/application/app-context';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { colors, radii, spacing } from '@/constants/tokens';

export default function PermissionsScreen() {
  const { isNotificationPermissionLoading, notificationPermissionState, preferences, requestNotificationPermission } = useDisasterReady();
  const notificationEnabled = notificationPermissionState === 'granted' || notificationPermissionState === 'provisional' || notificationPermissionState === 'ephemeral';

  return (
    <Screen footer={<PrimaryButton accessibilityLabel="Continue to accessibility preferences" onPress={() => router.push('/onboarding/accessibility' as Href)}>Continue</PrimaryButton>}>
      <AppHeader title="Location & alerts" subtitle="Step 2 of 3" back />
      <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
      <View style={styles.copy}>
        <AppText variant="heading">Why we ask</AppText>
        <AppText color={colors.inkMuted}>You stay in control of how DisasterReady uses location and notifications.</AppText>
      </View>
      <Card style={styles.card}>
        <View style={styles.iconBox}><Icon name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} color={colors.primary} size={24} /></View>
        <View style={styles.itemCopy}>
          <AppText variant="bodyStrong">Alert location</AppText>
          <AppText color={colors.inkMuted}>The saved city is used for official alerts. DisasterReady does not create a continuous location history.</AppText>
          <StatusBadge label={`${preferences.location.city}, ${preferences.location.region}`} tone="info" />
        </View>
      </Card>
      <Card style={styles.card}>
        <View style={styles.iconBox}><Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={colors.primary} size={24} /></View>
        <View style={styles.itemCopy}>
          <AppText variant="bodyStrong">Notifications</AppText>
          <AppText color={colors.inkMuted}>On iOS and Android, allow verified emergency alerts to notify you. You can also decide later.</AppText>
          {notificationPermissionState === 'not-determined' ? (
            <SecondaryButton accessibilityLabel="Enable emergency notifications" loading={isNotificationPermissionLoading} onPress={() => void requestNotificationPermission()}>Enable notifications</SecondaryButton>
          ) : (
            <StatusBadge label={notificationPermissionState === 'unsupported' ? 'Available in the mobile app' : notificationEnabled ? 'Notifications allowed' : 'Notifications not enabled'} tone={notificationEnabled ? 'safe' : 'demo'} />
          )}
        </View>
      </Card>
      <Card tone="muted"><AppText variant="caption" color={colors.inkMuted}>Guest mode works without an account. Preferences stay on this device.</AppText></Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { width: '66%', height: '100%', backgroundColor: colors.primary },
  copy: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, gap: spacing.sm },
});
