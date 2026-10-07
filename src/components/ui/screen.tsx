import { use, type PropsWithChildren, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/tokens';

type ScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  scroll?: boolean;
  testID?: string;
  tabScreen?: boolean;
  tone?: 'default' | 'calm' | 'alert';
}>;

const toneColors = {
  default: colors.canvas,
  calm: colors.calmCanvas,
  alert: colors.alertCanvas,
};

export function Screen({ children, footer, scroll = true, tabScreen = false, testID, tone = 'default' }: ScreenProps) {
  const insets = use(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const backgroundColor = toneColors[tone];
  const content = <View style={[styles.content, tabScreen && styles.tabContent, !scroll && styles.fill]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']} testID={testID}>
      <View style={[styles.shell, { backgroundColor }]} testID="mobile-app-shell">
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : content}
        {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Platform.OS === 'web' ? colors.webBackdrop : colors.canvas },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    backgroundColor: colors.canvas,
    ...(Platform.OS === 'web'
      ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, boxShadow: '0 0 34px rgba(24, 48, 76, 0.12)' }
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.md },
  tabContent: { paddingBottom: 104 },
  fill: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
