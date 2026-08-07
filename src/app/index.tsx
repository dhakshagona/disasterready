import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/buttons';
import { Screen } from '@/components/ui/screen';
import { colors, spacing } from '@/constants/tokens';

export default function SplashScreen() {
  return (
    <Screen scroll={false} testID="splash-screen">
      <View style={styles.hero}>
        <View style={styles.logoHalo}>
          <Image
            accessibilityLabel="DisasterReady lifebuoy"
            contentFit="contain"
            source={require('@/assets/brand/lifebuoy.png')}
            style={styles.logo}
          />
        </View>
        <View style={styles.copy}>
          <AppText variant="display" style={styles.center}>DisasterReady</AppText>
          <AppText color={colors.inkMuted} style={styles.center}>
            Clear guidance when every minute matters.
          </AppText>
        </View>
      </View>
      <View style={styles.bottom}>
        <PrimaryButton accessibilityLabel="Get started" onPress={() => router.push('/welcome' as Href)}>
          Get started
        </PrimaryButton>
        <AppText variant="caption" color={colors.inkSubtle} style={styles.center}>
          Emergency information will never require an account.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxxl },
  logoHalo: {
    width: 268,
    height: 268,
    borderRadius: 134,
    backgroundColor: colors.canvasStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 236, height: 190 },
  copy: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  bottom: { gap: spacing.lg, paddingBottom: spacing.xl },
});
