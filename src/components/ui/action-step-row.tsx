import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, radii, spacing } from '@/constants/tokens';
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
      style={({ pressed }) => [styles.row, compact && styles.compact, completed && styles.rowComplete, pressed && styles.pressed]}
      testID={`action-step-${step.id}`}>
      <View style={[styles.checkbox, completed && styles.checkboxComplete]}>
        {completed ? (
          <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} color={colors.surface} size={16} />
        ) : null}
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
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderBottomColor: colors.border,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  compact: { minHeight: 52, alignItems: 'center', paddingVertical: 6 },
  rowComplete: { backgroundColor: colors.primarySoft, borderColor: '#BDD3FB' },
  pressed: { opacity: 0.66 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxComplete: { backgroundColor: colors.primary, borderColor: colors.primary },
  copy: { flex: 1, gap: spacing.xs },
  completedText: { textDecorationLine: 'line-through', color: colors.inkMuted },
});
