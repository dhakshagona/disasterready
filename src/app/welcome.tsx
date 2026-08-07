import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { colors, radii, spacing } from '@/constants/tokens';

const promises = [
  ['Understand the alert', 'See a concise summary with the official alert always available.'],
  ['Know what to do', 'Use reviewed, ordered steps—not improvised safety advice.'],
  ['Find a safe place', 'See only safety resources whose source and status are clear.'],
] as const;

export default function WelcomeScreen() {
  return (
    <Screen
      footer={
        <>
          <PrimaryButton accessibilityLabel="Continue as guest" onPress={() => router.push('/onboarding/hazards' as Href)}>
            Continue as guest
          </PrimaryButton>
          <SecondaryButton accessibilityLabel="Account sync is coming later" disabled>
            Account sync coming later
          </SecondaryButton>
        </>
      }>
      <View style={styles.brandRow}>
        <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.mark} />
        <AppText variant="bodyStrong">DisasterReady</AppText>
      </View>
      <View style={styles.intro}>
        <AppText variant="display" accessibilityRole="header">Stay calm.{`\n`}Know what comes next.</AppText>
        <AppText color={colors.inkMuted}>
          DisasterReady turns official emergency information into a clear, prioritized plan while keeping the source in reach.
        </AppText>
      </View>
      <Card style={styles.promiseCard}>
        {promises.map(([title, detail], index) => (
          <View key={title} style={styles.promiseRow}>
            <View style={styles.number}><AppText variant="caption" color={colors.primary}>{index + 1}</AppText></View>
            <View style={styles.promiseCopy}>
              <AppText variant="bodyStrong">{title}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>{detail}</AppText>
            </View>
            <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} color={colors.safe} size={18} />
          </View>
        ))}
      </Card>
      <AppText variant="caption" color={colors.inkSubtle}>
        Phase 1 uses clearly labeled simulated alerts. Live data and notification permissions are not connected yet.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { width: 42, height: 34 },
  intro: { gap: spacing.md, paddingTop: spacing.lg },
  promiseCard: { gap: 0 },
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  promiseCopy: { flex: 1, gap: spacing.xs },
});
