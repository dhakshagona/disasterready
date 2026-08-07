import { selectActionPlan } from '@/domain/action-plans/select-action-plan';
import type { Alert, HazardType } from '@/domain/models';
import { describe, expect, it } from '@jest/globals';

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'nws-flood-1',
    providerId: 'provider-flood-1',
    hazard: 'flood',
    headline: 'Flash Flood Warning',
    summary: 'Flash flooding is occurring.',
    severity: 'severe',
    urgency: 'immediate',
    certainty: 'observed',
    status: 'active',
    areaDescription: 'Travis County, Texas',
    issuedAt: '2026-08-07T20:00:00.000Z',
    expiresAt: '2026-08-07T22:00:00.000Z',
    source: 'National Weather Service',
    originalText: 'Official text',
    retrievedAt: '2026-08-07T20:05:00.000Z',
    freshness: 'current',
    isDemo: false,
    doNow: [],
    ...overrides,
  };
}

describe('deterministic action-plan selection', () => {
  it('selects the reviewed urgent flood template from structured alert fields', () => {
    const alert = makeAlert();
    const plan = selectActionPlan(alert);

    expect(plan).toMatchObject({
      id: 'plan-nws-flood-1-flood-urgent',
      alertId: alert.id,
      hazard: 'flood',
      title: 'Flood safety plan',
      isDemo: false,
    });
    expect(plan?.steps).toHaveLength(5);
    expect(plan?.steps.slice(0, 3).map((step) => step.title)).toEqual([
      'Move to higher ground',
      'Stay out of floodwater',
      'Follow local instructions',
    ]);
    expect(plan?.sourceReferences.every((reference) => reference.url.startsWith('https://'))).toBe(true);
    expect(plan?.rationale).toContain('severe');
    expect(plan?.rationale).toContain('immediate');
  });

  it('selects the same plan for the same structured input', () => {
    expect(selectActionPlan(makeAlert())).toEqual(selectActionPlan(makeAlert()));
  });

  const templateCases: [HazardType, string][] = [
    ['tornado', 'Tornado safety plan'],
    ['hurricane', 'Hurricane safety plan'],
    ['wildfire', 'Wildfire safety plan'],
    ['air-quality', 'Air quality safety plan'],
    ['winter-storm', 'Winter storm safety plan'],
    ['earthquake', 'Earthquake safety plan'],
  ];

  it.each(templateCases)('has a reviewed source-linked template for %s', (hazard, title) => {
    const plan = selectActionPlan(makeAlert({ hazard }));

    expect(plan?.title).toBe(title);
    expect(plan?.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan?.sourceReferences.length).toBeGreaterThan(0);
  });

  it('does not invent a plan for an unsupported alert', () => {
    expect(selectActionPlan(makeAlert({ hazard: 'other', headline: 'Dense Fog Advisory' }))).toBeNull();
  });

  it('does not present an action plan for an expired alert', () => {
    expect(selectActionPlan(makeAlert({ status: 'expired' }))).toBeNull();
  });
});
