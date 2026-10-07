revoke all on table public.analytics_events from service_role;

create or replace function public.ingest_analytics_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array'
    or jsonb_array_length(p_events) < 1 or jsonb_array_length(p_events) > 25 then
    raise exception 'Invalid analytics event batch';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_events) as batch(event)
    where jsonb_typeof(event) <> 'object'
      or not (event ?& array['id', 'session_id', 'name', 'occurred_at', 'mode', 'properties'])
      or exists (
        select 1
        from jsonb_object_keys(event) as fields(field_name)
        where field_name <> all (array['id', 'session_id', 'name', 'occurred_at', 'mode', 'properties'])
      )
  ) then
    raise exception 'Invalid analytics event shape';
  end if;

  insert into public.analytics_events (
    id,
    session_id,
    name,
    occurred_at,
    mode,
    properties
  )
  select
    event.id,
    event.session_id,
    event.name,
    event.occurred_at,
    event.mode,
    event.properties
  from jsonb_to_recordset(p_events) as event(
    id text,
    session_id text,
    name text,
    occurred_at timestamptz,
    mode text,
    properties jsonb
  )
  on conflict (id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.ingest_analytics_events(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_analytics_events(jsonb) to service_role;
