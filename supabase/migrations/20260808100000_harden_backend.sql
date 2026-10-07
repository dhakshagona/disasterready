do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_events_id_length_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_id_length_check
      check (char_length(id) = 36);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_events_id_uuid_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_id_uuid_check
      check (id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_events_session_id_uuid_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_session_id_uuid_check
      check (session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_events_properties_size_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_properties_size_check
      check (octet_length(properties::text) <= 2048);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_events_occurred_at_range_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_occurred_at_range_check
      check (occurred_at >= timestamptz '2025-01-01 00:00:00+00' and occurred_at < timestamptz '2100-01-01 00:00:00+00');
  end if;
end $$;

revoke all on table public.analytics_events from service_role;
grant insert on table public.analytics_events to service_role;

create index if not exists analytics_events_received_at_idx
  on public.analytics_events (received_at desc);

create index if not exists analytics_events_mode_received_at_idx
  on public.analytics_events (mode, received_at desc) include (name);

drop index if exists public.analytics_events_occurred_at_idx;
drop index if exists public.analytics_events_name_mode_idx;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.edge_rate_limits (
  scope text not null check (scope ~ '^[a-z][a-z0-9-]{0,63}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, key_hash)
);

create index if not exists edge_rate_limits_window_started_at_idx
  on private.edge_rate_limits (window_started_at);

alter table private.edge_rate_limits enable row level security;
alter table private.edge_rate_limits force row level security;
revoke all on table private.edge_rate_limits from public, anon, authenticated, service_role;

drop function if exists public.consume_edge_rate_limit(text, text, integer, integer);
drop function if exists public.consume_edge_rate_limit(text, text, integer, integer, integer);

create or replace function public.consume_edge_rate_limits(p_checks jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  check_item jsonb;
  check_scope text;
  check_key_hash text;
  check_limit integer;
  check_window_seconds integer;
  check_cost integer;
  is_allowed boolean;
  current_time timestamptz := statement_timestamp();
  stored_window timestamptz;
  stored_count integer;
begin
  if p_checks is null or jsonb_typeof(p_checks) <> 'array'
    or jsonb_array_length(p_checks) < 1 or jsonb_array_length(p_checks) > 8 then
    raise exception 'Invalid rate limit checks';
  end if;

  if (
    select count(*) <> count(distinct ((value ->> 'scope') || ':' || (value ->> 'key_hash')))
    from jsonb_array_elements(p_checks)
  ) then
    raise exception 'Duplicate rate limit check';
  end if;

  for check_item in
    select value
    from jsonb_array_elements(p_checks)
    order by value ->> 'scope', value ->> 'key_hash'
  loop
    if jsonb_typeof(check_item) <> 'object'
      or not (check_item ?& array['scope', 'key_hash', 'limit', 'window_seconds', 'cost'])
      or exists (
        select 1
        from jsonb_object_keys(check_item) as fields(field_name)
        where field_name <> all (array['scope', 'key_hash', 'limit', 'window_seconds', 'cost'])
      )
    then
      raise exception 'Invalid rate limit check shape';
    end if;

    check_scope := check_item ->> 'scope';
    check_key_hash := check_item ->> 'key_hash';
    check_limit := (check_item ->> 'limit')::integer;
    check_window_seconds := (check_item ->> 'window_seconds')::integer;
    check_cost := (check_item ->> 'cost')::integer;
    if check_scope !~ '^[a-z][a-z0-9-]{0,63}$'
      or check_key_hash !~ '^[0-9a-f]{64}$'
      or check_limit < 1 or check_limit > 1000000
      or check_window_seconds < 1 or check_window_seconds > 86400
      or check_cost < 1 or check_cost > 1000 or check_cost > check_limit
    then
      raise exception 'Invalid rate limit input';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(check_scope || ':' || check_key_hash, 0)
    );
  end loop;

  for check_item in select value from jsonb_array_elements(p_checks)
  loop
    check_scope := check_item ->> 'scope';
    check_key_hash := check_item ->> 'key_hash';
    check_limit := (check_item ->> 'limit')::integer;
    check_window_seconds := (check_item ->> 'window_seconds')::integer;
    check_cost := (check_item ->> 'cost')::integer;

    select limits.window_started_at, limits.request_count
      into stored_window, stored_count
    from private.edge_rate_limits as limits
    where limits.scope = check_scope and limits.key_hash = check_key_hash;

    is_allowed := not found
      or stored_window <= current_time - make_interval(secs => check_window_seconds)
      or stored_count + check_cost <= check_limit;
    if not is_allowed then return false; end if;
  end loop;

  for check_item in select value from jsonb_array_elements(p_checks)
  loop
    check_scope := check_item ->> 'scope';
    check_key_hash := check_item ->> 'key_hash';
    check_window_seconds := (check_item ->> 'window_seconds')::integer;
    check_cost := (check_item ->> 'cost')::integer;

    insert into private.edge_rate_limits as limits (
      scope,
      key_hash,
      window_started_at,
      request_count
    ) values (
      check_scope,
      check_key_hash,
      current_time,
      check_cost
    )
    on conflict (scope, key_hash) do update set
      window_started_at = case
        when limits.window_started_at <= current_time - make_interval(secs => check_window_seconds) then current_time
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at <= current_time - make_interval(secs => check_window_seconds) then check_cost
        else limits.request_count + check_cost
      end;
  end loop;

  return true;
end;
$$;

revoke all on function public.consume_edge_rate_limits(jsonb) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limits(jsonb) to service_role;

create or replace function public.delete_expired_edge_rate_limits(batch_size integer default 5000)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  if batch_size < 1 or batch_size > 25000 then
    raise exception 'Batch size must be between 1 and 25000';
  end if;

  with expired as (
    select limits.ctid
    from private.edge_rate_limits as limits
    where limits.window_started_at < statement_timestamp() - interval '2 days'
    order by limits.window_started_at
    limit batch_size
    for update skip locked
  )
  delete from private.edge_rate_limits as limits
  using expired
  where limits.ctid = expired.ctid;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_edge_rate_limits(integer) from public, anon, authenticated;
grant execute on function public.delete_expired_edge_rate_limits(integer) to service_role;

create or replace view public.analytics_daily_counts as
select
  date_trunc('day', received_at at time zone 'UTC')::date as received_day,
  mode,
  name,
  count(*)::bigint as event_count
from public.analytics_events
group by 1, 2, 3;

revoke all on table public.analytics_daily_counts from public, anon, authenticated;
grant select on table public.analytics_daily_counts to service_role;

create or replace function public.delete_expired_analytics_events(
  retain_days integer default 90,
  batch_size integer default 5000
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  if retain_days < 30 or retain_days > 3650 then
    raise exception 'Retention must be between 30 and 3650 days';
  end if;

  if batch_size < 1 or batch_size > 25000 then
    raise exception 'Batch size must be between 1 and 25000';
  end if;

  with expired as (
    select events.ctid
    from public.analytics_events as events
    where events.received_at < statement_timestamp() - make_interval(days => retain_days)
    order by events.received_at
    limit batch_size
    for update skip locked
  )
  delete from public.analytics_events as events
  using expired
  where events.ctid = expired.ctid;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_analytics_events(integer, integer) from public, anon, authenticated;
grant execute on function public.delete_expired_analytics_events(integer, integer) to service_role;
