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
  rate_time timestamptz := statement_timestamp();
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
      or stored_window <= rate_time - make_interval(secs => check_window_seconds)
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
      rate_time,
      check_cost
    )
    on conflict (scope, key_hash) do update set
      window_started_at = case
        when limits.window_started_at <= rate_time - make_interval(secs => check_window_seconds) then rate_time
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at <= rate_time - make_interval(secs => check_window_seconds) then check_cost
        else limits.request_count + check_cost
      end;
  end loop;

  return true;
end;
$$;

revoke all on function public.consume_edge_rate_limits(jsonb) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limits(jsonb) to service_role;
