import { useLocalSearchParams } from 'expo-router';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useDisasterReady } from '@/application/app-context';
import { ActionStepRow } from '@/components/ui/action-step-row';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { DemoBanner, ErrorState, LoadingState } from '@/components/ui/state-messages';
import { colors, radii, spacing } from '@/constants/tokens';
import { demoFloodAlert, demoFloodPlan, hazardLabels } from '@/data/mock-repositories';
import { selectActionPlan } from '@/domain/action-plans/select-action-plan';

export default function ActionPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { checklistRepository, getAlertById, isLoading, trackEvent } = useDisasterReady();
  const alert = id === demoFloodAlert.id || id === demoFloodPlan.id ? demoFloodAlert : getAlertById(id);
  const plan = useMemo(() => alert ? selectActionPlan(alert) : null, [alert]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const openedPlanIdRef = useRef<string | null>(null);
  const checklistStartedRef = useRef(false);
  const checklistCompletedRef = useRef(false);
  const isProgressLoading = Boolean(plan && loadedPlanId !== plan.id);

  useEffect(() => {
    if (!plan || openedPlanIdRef.current === plan.id) return;
    openedPlanIdRef.current = plan.id;
    void trackEvent('action_plan_opened', {
      mode: plan.isDemo ? 'demo' : 'real',
      properties: { hazard: plan.hazard, stepCount: plan.steps.length },
    });
  }, [plan, trackEvent]);

  useEffect(() => {
    let mounted = true;
    if (!plan) {
      return () => { mounted = false; };
    }
    void checklistRepository.getCompleted(plan.id).then((saved) => {
      if (mounted) {
        setCompletedIds(new Set([...saved].filter((stepId) => plan.steps.some((step) => step.id === stepId))));
        setLoadedPlanId(plan.id);
      }
    });
    return () => { mounted = false; };
  }, [checklistRepository, plan]);

  if (!plan) {
    return (
      <Screen>
        <AppHeader title="Emergency checklist" back />
        {isLoading ? <LoadingState label="Loading safety plan…" /> : <ErrorState message="No reviewed action plan is available for this alert." />}
      </Screen>
    );
  }

  const completedCount = completedIds.size;
  const percent = Math.round((completedCount / plan.steps.length) * 100);

  function saveProgress(next: Set<string>) {
    const eventOptions = {
      mode: plan!.isDemo ? 'demo' as const : 'real' as const,
      properties: { hazard: plan!.hazard, stepCount: plan!.steps.length },
    };
    if (completedIds.size === 0 && next.size > 0 && !checklistStartedRef.current) {
      checklistStartedRef.current = true;
      void trackEvent('checklist_started', eventOptions);
    }
    if (completedIds.size < plan!.steps.length && next.size === plan!.steps.length && !checklistCompletedRef.current) {
      checklistCompletedRef.current = true;
      void trackEvent('checklist_completed', eventOptions);
    }
    setCompletedIds(next);
    void checklistRepository.setCompleted(plan!.id, next);
  }

  function toggleStep(stepId: string) {
    const next = new Set(completedIds);
    if (next.has(stepId)) next.delete(stepId);
    else next.add(stepId);
    saveProgress(next);
  }

  function markAllDone() {
    saveProgress(new Set(plan!.steps.map((step) => step.id)));
  }

  async function shareSummary() {
    const completeSteps = plan!.steps.filter((step) => completedIds.has(step.id));
    const summary = completeSteps.length ? completeSteps.map((step) => `✓ ${step.title}`).join('\n') : 'No steps marked complete yet.';
    await Share.share({ message: `${plan!.isDemo ? 'DisasterReady DEMO' : 'DisasterReady'} · ${plan!.title}\n${completedCount}/${plan!.steps.length} complete\n${summary}` });
  }

  return (
    <Screen testID="action-plan-screen">
      <AppHeader title="Emergency checklist" subtitle={`${hazardLabels[plan.hazard]} guidance`} back />
      {plan.isDemo ? <DemoBanner label="Demo · Safety checklist" /> : null}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.flex}>
            <AppText variant="title">{plan.title}</AppText>
            <AppText variant="caption" color={colors.inkMuted}>Tap each step as you complete it. Progress is saved on this device.</AppText>
          </View>
          <AppText variant="bodyStrong" color={completedCount === plan.steps.length ? colors.safeStrong : colors.primary}>{completedCount} of {plan.steps.length}</AppText>
        </View>
        <View accessibilityLabel={`${percent} percent complete`} accessibilityRole="progressbar" style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>

      {isProgressLoading ? <LoadingState label="Loading saved progress…" /> : (
        <View style={styles.steps}>
          {plan.steps.map((step) => <ActionStepRow key={step.id} step={step} completed={completedIds.has(step.id)} onToggle={() => toggleStep(step.id)} />)}
        </View>
      )}

      {!isProgressLoading ? (
        <View style={styles.actions}>
          <PrimaryButton accessibilityLabel="Mark all checklist steps done" disabled={completedCount === plan.steps.length} onPress={markAllDone}>{completedCount === plan.steps.length ? 'All steps completed' : 'Mark all done'}</PrimaryButton>
          <SecondaryButton accessibilityLabel="Share checklist summary" onPress={shareSummary}>Share progress summary</SecondaryButton>
          {completedCount > 0 ? <SecondaryButton accessibilityLabel="Reset all checklist progress" onPress={() => saveProgress(new Set())}>Reset checklist</SecondaryButton> : null}
        </View>
      ) : null}

      <Card tone="muted" style={styles.source}>
        <AppText variant="eyebrow" color={colors.inkMuted}>Guidance source</AppText>
        <AppText variant="bodyStrong">{plan.sourceName}</AppText>
        <AppText variant="caption" color={colors.inkMuted}>{plan.sourceNote}</AppText>
        {plan.sourceReferences.map((reference) => (
          <SecondaryButton key={reference.url} accessibilityLabel={`Open official source: ${reference.label}`} onPress={() => Linking.openURL(reference.url)}>{reference.label}</SecondaryButton>
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
