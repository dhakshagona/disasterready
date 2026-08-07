import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, radii, spacing } from '@/constants/tokens';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  trailing?: React.ReactNode;
};

export function AppHeader({ title, subtitle, back, trailing }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Icon name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        <AppText variant="title" accessibilityRole="header">{title}</AppText>
        {subtitle ? <AppText variant="caption" color={colors.inkMuted}>{subtitle}</AppText> : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.68 },
});
