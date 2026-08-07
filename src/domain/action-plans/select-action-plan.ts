import { reviewedActionPlanTemplates } from '@/domain/action-plans/templates';
import type { ActionPlan, Alert } from '@/domain/models';

function selectRiskTier(alert: Alert): 'urgent' | 'standard' {
  return alert.urgency === 'immediate' || alert.severity === 'severe' || alert.severity === 'extreme'
    ? 'urgent'
    : 'standard';
}

export function selectActionPlan(alert: Alert): ActionPlan | null {
  if (alert.status !== 'active') return null;
  const template = reviewedActionPlanTemplates[alert.hazard];
  if (!template) return null;
  const tier = selectRiskTier(alert);
  return {
    id: `plan-${alert.id}-${alert.hazard}-${tier}`,
    alertId: alert.id,
    hazard: alert.hazard,
    title: template.title,
    rationale: `Selected from reviewed ${alert.hazard} guidance because the alert is ${alert.severity}, ${alert.urgency}, and ${alert.certainty}.`,
    steps: template.steps.map((step) => ({ ...step })),
    sourceName: template.sourceName,
    sourceNote: 'Safety steps are deterministic and reviewed against the official sources below. They are never generated from alert prose.',
    sourceReferences: template.sourceReferences.map((reference) => ({ ...reference })),
    isDemo: alert.isDemo,
  };
}
