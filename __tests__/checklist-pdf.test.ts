import { buildChecklistPdfHtml } from '@/application/checklists/checklist-pdf';
import { demoFloodPlan } from '@/data/mock-repositories';
import { describe, expect, it } from '@jest/globals';

describe('buildChecklistPdfHtml', () => {
  it('renders saved completion state and safety attribution', () => {
    const completed = new Set([demoFloodPlan.steps[0]!.id]);
    const html = buildChecklistPdfHtml(demoFloodPlan, completed, new Date('2026-08-08T12:00:00.000Z'));

    expect(html).toContain('1 of 5 steps completed');
    expect(html).toContain('&#10003;');
    expect(html).toContain('Guidance source:');
    expect(html).toContain('Demo checklist');
    expect(html).toContain('Follow current instructions from emergency officials.');
  });

  it('escapes user-controlled text before placing it in the document', () => {
    const html = buildChecklistPdfHtml({ ...demoFloodPlan, title: '<script>alert("unsafe")</script>' }, new Set());

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;');
  });
});
