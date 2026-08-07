import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, type } from '@/constants/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'eyebrow';

type AppTextProps = PropsWithChildren<TextProps> & {
  variant?: Variant;
  color?: string;
};

export function AppText({ children, variant = 'body', color = colors.ink, style, ...props }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[styles.base, styles[variant], { color }, style]}
      {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: 'System' },
  display: { fontSize: type.display, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7 },
  title: { fontSize: type.title, lineHeight: 31, fontWeight: '800', letterSpacing: -0.35 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: type.body, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: type.bodyStrong, lineHeight: 23, fontWeight: '700' },
  caption: { fontSize: type.caption, lineHeight: 19, fontWeight: '500' },
  eyebrow: {
    fontSize: type.eyebrow,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
