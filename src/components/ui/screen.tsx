import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/tokens';

type ScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  scroll?: boolean;
  testID?: string;
}>;

export function Screen({ children, footer, scroll = true, testID }: ScreenProps) {
  const content = <View style={[styles.content, !scroll && styles.fill]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']} testID={testID}>
      <View style={styles.shell}>
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
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
      ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border, boxShadow: '0 0 30px rgba(24, 48, 76, 0.10)' }
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
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
