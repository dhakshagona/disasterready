import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { colors, radii, spacing } from '@/constants/tokens';

const features = [
  ['warning', 'Clear alerts'],
  ['checklist', 'Simple action plans'],
  ['verified_user', 'Trusted guidance'],
] as const;

export default function WelcomeScreen() {
  return (
    <Screen
      footer={
        <>
          <PrimaryButton accessibilityLabel="Continue as guest" onPress={() => router.push('/onboarding/hazards' as Href)}>
            Continue as guest
          </PrimaryButton>
          <SecondaryButton accessibilityLabel="Sign in or create account unavailable" disabled>
            Sign in or create account
          </SecondaryButton>
        </>
      }>
      <View style={styles.brandRow}>
        <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.brandMark} contentFit="contain" />
        <AppText variant="bodyStrong">DisasterReady</AppText>
      </View>
      <View style={styles.hero}>
        <View style={styles.artworkHalo}>
          <Image source={require('@/assets/brand/lifebuoy.png')} style={styles.artwork} contentFit="contain" />
        </View>
        <View style={styles.intro}>
          <AppText variant="display" accessibilityRole="header" style={styles.centerText}>Be ready when it matters.</AppText>
          <AppText color={colors.inkMuted} style={styles.centerText}>
            Local alerts, clear next steps, and trusted safety guidance in one calm place.
          </AppText>
        </View>
      </View>
      <View style={styles.features}>
        {features.map(([icon, label]) => (
          <View key={label} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Icon name={{ ios: icon === 'verified_user' ? 'checkmark.shield.fill' : icon === 'warning' ? 'exclamationmark.triangle.fill' : 'checklist', android: icon, web: icon }} color={colors.primary} size={19} />
            </View>
            <AppText variant="caption" style={styles.centerText}>{label}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brandMark: { width: 38, height: 31 },
  hero: { flex: 1, minHeight: 390, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  artworkHalo: { width: 248, height: 210, borderRadius: radii.xl, backgroundColor: colors.canvasStrong, alignItems: 'center', justifyContent: 'center' },
  artwork: { width: 222, height: 180 },
  intro: { maxWidth: 340, alignItems: 'center', gap: spacing.sm },
  centerText: { textAlign: 'center' },
  features: { flexDirection: 'row', gap: spacing.sm },
  feature: { flex: 1, minHeight: 90, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  featureIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
});
