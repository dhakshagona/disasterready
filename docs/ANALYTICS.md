# Analytics and metric glossary

## Principles

- Analytics must not block emergency workflows.
- Events queue locally and deliver only when Supabase is configured.
- Every event is labeled `real` or `demo`.
- Session start mode is assigned by the Home route, so a direct demo visit does not create a real session event.
- Contact, saved location, coordinates, city, and postal code are not accepted.
- Metrics describe observed product events, not user intent or safety outcomes.
- This repository contains no fabricated totals.
- Anonymous telemetry is rate-limited and schema-validated, but it is not authenticated user evidence. Treat it as operational telemetry.

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

Reports must filter by mode before aggregation. Prefer `received_at`, which is assigned by PostgreSQL, for reporting windows and retention. `occurred_at` is accepted only within a bounded client clock window.

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
  received_day,
  mode,
  name,
  event_count
from public.analytics_daily_counts
order by received_day desc, mode, name;
```

Always display demo and real rows separately.

## Retention and access

- Client roles have no direct table or reporting-view access.
- The Edge Function service role can execute the bounded ingestion RPC but has no direct `analytics_events` table privileges.
- The server reporting view groups by server-controlled UTC receipt date and mode.
- `delete_expired_analytics_events(90, 5000)` provides a batched retention path for a scheduled server job.
- `delete_expired_edge_rate_limits(5000)` removes expired hashed limiter rows in bounded batches.
- No report should treat random session IDs as accounts, people, or cross-install identity.
