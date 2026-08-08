create table if not exists public.analytics_events (
  id text primary key,
  session_id text not null check (char_length(session_id) between 1 and 128),
  name text not null check (name in (
    'session_started',
    'alerts_fetched',
    'alerts_normalized',
    'action_plan_opened',
    'checklist_started',
    'checklist_completed',
    'shelter_lookup',
    'demo_session_started',
    'ai_simplification_requested',
    'ai_simplification_used',
    'ai_simplification_fallback'
  )),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  mode text not null check (mode in ('real', 'demo')),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object')
);

comment on table public.analytics_events is
  'Anonymous aggregate product events. The Edge Function rejects contact, location, and arbitrary properties.';

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant all on table public.analytics_events to service_role;

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_name_mode_idx
  on public.analytics_events (name, mode, occurred_at desc);
