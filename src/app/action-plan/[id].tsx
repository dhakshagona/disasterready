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

  const activePlan = plan;
  const completedCount = completedIds.size;
  const percent = Math.round((completedCount / activePlan.steps.length) * 100);

  function toggleStep(stepId: string) {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  function resetPlan() {
    setCompletedIds(new Set());
  }

  async function shareSummary() {
    const completeSteps = activePlan.steps.filter((step) => completedIds.has(step.id));
    const summary = completeSteps.length
      ? completeSteps.map((step) => `✓ ${step.title}`).join('\n')
      : 'No steps marked complete yet.';
    await Share.share({ message: `DisasterReady DEMO — ${activePlan.title}\n${completedCount}/${activePlan.steps.length} complete\n${summary}` });
  }

  return (
    <Screen testID="action-plan-screen">
      <AppHeader title="Action plan" subtitle="Progress is local to this screen in Phase 1" back />
      <DemoBanner label="Demo Mode — reviewed prototype checklist" />
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressCopy}>
            <AppText variant="title">{activePlan.title}</AppText>
            <AppText variant="caption" color={colors.inkMuted}>{completedCount} of {activePlan.steps.length} steps complete</AppText>
          </View>
          <View style={[styles.percentCircle, completedCount === plan.steps.length && styles.completeCircle]}>
            <AppText variant="bodyStrong" color={completedCount === plan.steps.length ? colors.safe : colors.primary}>{percent}%</AppText>
          </View>
        </View>
        <View accessibilityLabel={`${percent} percent complete`} accessibilityRole="progressbar" style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <AppText variant="caption" color={colors.inkMuted}>{activePlan.rationale}</AppText>
      </Card>
      <Card style={styles.stepsCard}>
        {activePlan.steps.map((step) => (
          <ActionStepRow
            key={step.id}
            step={step}
            completed={completedIds.has(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </Card>
      <View style={styles.actions}>
        <PrimaryButton accessibilityLabel="Share checklist summary" onPress={shareSummary}>Share progress summary</PrimaryButton>
        <SecondaryButton accessibilityLabel="Reset all checklist progress" disabled={completedCount === 0} onPress={resetPlan}>Reset checklist</SecondaryButton>
      </View>
      <Card tone="muted" style={styles.source}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Guidance source</AppText>
        <AppText variant="bodyStrong">{activePlan.sourceName}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{activePlan.sourceNote}</AppText>
        {activePlan.sourceReferences.map((reference) => (
          <SecondaryButton
            key={reference.url}
            accessibilityLabel={`Open official source: ${reference.label}`}
            onPress={() => Linking.openURL(reference.url)}>
            {reference.label}
          </SecondaryButton>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: { gap: spacing.lg },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressCopy: { flex: 1, gap: spacing.xs },
  percentCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  completeCircle: { borderColor: colors.safe, backgroundColor: colors.safeSoft },
  track: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.safe },
  stepsCard: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  actions: { gap: spacing.md },
  source: { gap: spacing.sm },
});
