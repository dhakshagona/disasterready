# Analytics and metric glossary

## Principles

- Analytics must not block emergency workflows.
- Events queue locally and deliver only when Supabase is configured.
- Every event is labeled `real` or `demo`.
- Contact, saved location, coordinates, city, and postal code are not accepted.
- Metrics describe observed product events, not user intent or safety outcomes.
- This repository contains no fabricated totals.

## Event glossary

| Event | Exact meaning | Allowed properties |
| --- | --- | --- |
| `session_started` | The application provider initialized in a client session. This is not a unique person. | none |
| `alerts_fetched` | An alert service retrieval completed and returned a feed state. | source, active count, recent count, hazard categories |
| `alerts_normalized` | One NWS payload was parsed at the source boundary. | accepted count, hazard categories |
| `action_plan_opened` | A reviewed plan screen rendered for an alert. | hazard, step count |
| `checklist_started` | A mounted checklist first moved from zero completed steps to at least one by user action. | hazard, step count |
| `checklist_completed` | A mounted checklist first reached all steps complete by user action. | hazard, step count |
| `shelter_lookup` | A FEMA shelter lookup completed. | source, result count, stale flag |
| `demo_session_started` | The simulated flood flow became active on Home. | hazard, entry surface |
| `ai_simplification_requested` | The app requested optional wording. | hazard |
| `ai_simplification_used` | A response passed schema and safety validation. | hazard |
| `ai_simplification_fallback` | The deterministic summary was retained. | hazard, fallback reason |

## Derived metrics

Reports must filter by mode before aggregation.

- Real checklist start rate: real `checklist_started` events divided by real `action_plan_opened` events in the same reporting window
- Real checklist completion rate: real `checklist_completed` events divided by real `checklist_started` events in the same reporting window
- Demo completion rate: the same calculation using demo mode only, reported as demo behavior
- AI validated-use rate: `ai_simplification_used` divided by `ai_simplification_requested`
- AI fallback rate: `ai_simplification_fallback` divided by `ai_simplification_requested`, grouped by reason
- Shelter empty-result rate: `shelter_lookup` events where count is zero divided by all shelter lookups

These are event ratios, not unique-user conversion rates. Random session identifiers can estimate sessions but do not identify people across installs.

## Example SQL

```sql
select
  date_trunc('day', occurred_at) as day,
  mode,
  name,
  count(*) as events
from public.analytics_events
group by 1, 2, 3
order by 1 desc, 2, 3;
```

Always display demo and real rows separately.
