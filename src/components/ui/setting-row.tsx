import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, layout, spacing } from '@/constants/tokens';

type SettingRowProps = {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingRow({ label, detail, value, onValueChange }: SettingRowProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail ? <AppText variant="caption" color={colors.inkMuted}>{detail}</AppText> : null}
      </View>
      <Switch
        accessible={false}
        pointerEvents="none"
        value={value}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: layout.minTouchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.68 },
});
