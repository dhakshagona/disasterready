import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { colors, radii, spacing } from '@/constants/tokens';

const permissionItems = [
  {
    icon: { ios: 'location.fill', android: 'location_on', web: 'location_on' } as const,
    title: 'Your location',
    body: 'Used to find alerts for the place you care about. We do not create a continuous location history.',
    action: 'Use Austin, TX for now',
  },
  {
    icon: { ios: 'bell.fill', android: 'notifications', web: 'notifications' } as const,
    title: 'Notifications',
    body: 'Choose which verified emergency alerts may notify you. You can decide after setup.',
    action: 'Decide later',
  },
];

export default function PermissionsScreen() {
  return (
    <Screen footer={<PrimaryButton accessibilityLabel="Continue to accessibility preferences" onPress={() => router.push('/onboarding/accessibility' as Href)}>Continue</PrimaryButton>}>
      <AppHeader title="Location & alerts" subtitle="Step 2 of 3" back />
      <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
      <View style={styles.copy}>
        <AppText variant="heading">Why we ask</AppText>
        <AppText color={colors.inkMuted}>You stay in control of how DisasterReady uses location and notifications.</AppText>
      </View>
      {permissionItems.map((item) => (
        <Card key={item.title} style={styles.card}>
          <View style={styles.iconBox}><Icon name={item.icon} color={colors.primary} size={24} /></View>
          <View style={styles.itemCopy}>
            <AppText variant="bodyStrong">{item.title}</AppText>
            <AppText color={colors.inkMuted}>{item.body}</AppText>
            <View style={styles.choice}><AppText variant="caption" color={colors.primary}>{item.action}</AppText></View>
          </View>
        </Card>
      ))}
      <Card tone="muted"><AppText variant="caption" color={colors.inkMuted}>Guest mode works without an account. You can update these choices in Settings.</AppText></Card>
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
  choice: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
