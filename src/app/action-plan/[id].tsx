import { useLocalSearchParams } from 'expo-router';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { ActionStepRow } from '@/components/ui/action-step-row';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoFloodPlan } from '@/data/mock-repositories';

export default function ActionPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = id === demoFloodPlan.id ? demoFloodPlan : null;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (!plan) {
    return (
      <Screen>
        <AppHeader title="Action plan" back />
        <ErrorState message="This local action plan could not be found." />
      </Screen>
    );
  }

  const completedCount = completedIds.size;
  const percent = Math.round((completedCount / plan.steps.length) * 100);

  function toggleStep(stepId: string) {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  function markAllDone() {
    setCompletedIds(new Set(plan!.steps.map((step) => step.id)));
  }

  async function shareSummary() {
    const completeSteps = plan!.steps.filter((step) => completedIds.has(step.id));
    const summary = completeSteps.length
      ? completeSteps.map((step) => `✓ ${step.title}`).join('\n')
      : 'No steps marked complete yet.';
    await Share.share({ message: `DisasterReady DEMO · ${plan!.title}\n${completedCount}/${plan!.steps.length} complete\n${summary}` });
  }

  return (
    <Screen testID="action-plan-screen">
      <AppHeader title="Emergency checklist" subtitle="Flood preparation" back />
      <DemoBanner label="Demo · Safety checklist" />
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.flex}>
            <AppText variant="title">{plan.title}</AppText>
            <AppText variant="caption" color={colors.inkMuted}>Tap each step as you complete it.</AppText>
          </View>
          <AppText variant="bodyStrong" color={completedCount === plan.steps.length ? colors.safeStrong : colors.primary}>
            {completedCount} of {plan.steps.length}
          </AppText>
        </View>
        <View accessibilityLabel={`${percent} percent complete`} accessibilityRole="progressbar" style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>

      <View style={styles.steps}>
        {plan.steps.map((step) => (
          <ActionStepRow key={step.id} step={step} completed={completedIds.has(step.id)} onToggle={() => toggleStep(step.id)} />
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton accessibilityLabel="Mark all checklist steps done" disabled={completedCount === plan.steps.length} onPress={markAllDone}>
          {completedCount === plan.steps.length ? 'All steps completed' : 'Mark all done'}
        </PrimaryButton>
        <SecondaryButton accessibilityLabel="Share checklist summary" onPress={shareSummary}>Share progress summary</SecondaryButton>
        {completedCount > 0 ? (
          <SecondaryButton accessibilityLabel="Reset all checklist progress" onPress={() => setCompletedIds(new Set())}>Reset checklist</SecondaryButton>
        ) : null}
      </View>

      <Card tone="muted" style={styles.source}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Guidance source</AppText>
        <AppText variant="bodyStrong">{plan.sourceName}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{plan.sourceNote}</AppText>
        {plan.sourceReferences.map((reference) => (
          <SecondaryButton key={reference.url} accessibilityLabel={`Open official source: ${reference.label}`} onPress={() => Linking.openURL(reference.url)}>
            {reference.label}
          </SecondaryButton>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressSection: { gap: spacing.md },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  track: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.primary },
  steps: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  source: { gap: spacing.sm },
});
