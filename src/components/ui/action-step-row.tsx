import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, layout, radii, spacing } from '@/constants/tokens';
import type { ActionStep } from '@/domain/models';

type ActionStepRowProps = {
  step: ActionStep;
  completed: boolean;
  onToggle: () => void;
  compact?: boolean;
};

export function ActionStepRow({ step, completed, onToggle, compact = false }: ActionStepRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${step.title}. ${step.detail}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, compact && styles.compact, pressed && styles.pressed]}
      testID={`action-step-${step.id}`}>
      <View style={[styles.checkbox, completed && styles.checkboxComplete]}>
        {completed ? (
          <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} color={colors.surface} size={16} />
        ) : (
          <AppText variant="caption" color={colors.primary}>{step.priority}</AppText>
        )}
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong" style={completed && styles.completedText}>{step.title}</AppText>
        {!compact ? <AppText variant="caption" color={colors.inkMuted}>{step.detail}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compact: { minHeight: layout.minTouchTarget, alignItems: 'center' },
  pressed: { opacity: 0.66 },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxComplete: { backgroundColor: colors.safe, borderColor: colors.safe },
  copy: { flex: 1, gap: spacing.xs },
  completedText: { textDecorationLine: 'line-through', color: colors.inkMuted },
});
