import type { ActionPlan } from '@/domain/models';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildChecklistPdfHtml(plan: ActionPlan, completedIds: ReadonlySet<string>, generatedAt = new Date()): string {
  const completedCount = plan.steps.filter((step) => completedIds.has(step.id)).length;
  const rows = plan.steps.map((step) => {
    const completed = completedIds.has(step.id);
    return `
      <li class="step ${completed ? 'complete' : ''}">
        <span class="box">${completed ? '&#10003;' : ''}</span>
        <span><strong>${escapeHtml(step.title)}</strong><br /><small>${escapeHtml(step.detail)}</small></span>
      </li>`;
  }).join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page { margin: 36px; }
        body { color: #121A26; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.4; margin: 0; }
        .header { border-bottom: 3px solid #316BE7; margin-bottom: 24px; padding-bottom: 16px; }
        .brand { color: #316BE7; font-size: 14px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        h1 { font-size: 28px; margin: 6px 0; }
        .meta { color: #626E7F; font-size: 13px; }
        .progress { background: #E7F0FF; border-radius: 10px; color: #2458C6; font-size: 16px; font-weight: 700; margin-bottom: 18px; padding: 12px 14px; }
        ol { list-style: none; margin: 0; padding: 0; }
        .step { align-items: flex-start; border: 1px solid #DCE3EC; border-radius: 10px; display: flex; gap: 12px; margin-bottom: 10px; padding: 12px; }
        .step.complete { background: #E1F7EC; border-color: #22A66F; }
        .box { align-items: center; border: 2px solid #316BE7; border-radius: 6px; color: #FFFFFF; display: inline-flex; flex: 0 0 24px; height: 24px; justify-content: center; width: 24px; }
        .complete .box { background: #22A66F; border-color: #22A66F; }
        small { color: #626E7F; }
        .source { background: #F7F9FC; border-radius: 10px; font-size: 12px; margin-top: 22px; padding: 12px; }
        .warning { color: #B01F35; font-size: 12px; font-weight: 700; margin-top: 18px; }
      </style>
    </head>
    <body>
      <section class="header">
        <div class="brand">DisasterReady</div>
        <h1>${escapeHtml(plan.title)}</h1>
        <div class="meta">Created ${escapeHtml(generatedAt.toLocaleString('en-US'))}${plan.isDemo ? ' | Demo checklist' : ''}</div>
      </section>
      <div class="progress">${completedCount} of ${plan.steps.length} steps completed</div>
      <ol>${rows}</ol>
      <section class="source"><strong>Guidance source:</strong> ${escapeHtml(plan.sourceName)}<br />${escapeHtml(plan.sourceNote)}</section>
      <p class="warning">Follow current instructions from emergency officials. This checklist does not replace 911, the National Weather Service, FEMA, or local authorities.</p>
    </body>
  </html>`;
}
