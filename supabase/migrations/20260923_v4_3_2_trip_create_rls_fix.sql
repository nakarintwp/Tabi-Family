-- Tabi Family V4.3.2 — Trip Create RLS Fix
-- Run once in Supabase SQL Editor after V4.3/V4.3.1.
--
-- Why this patch exists:
-- create_trip_bundle_once() previously ran as SECURITY INVOKER. That meant its
-- INSERT into public.trips was evaluated through the caller's RLS path again.
-- The function already derives owner_id exclusively from auth.uid(), so we can
-- safely make this narrowly-scoped RPC SECURITY DEFINER while keeping the
-- caller unable to choose another owner.

create or replace function public.create_trip_bundle_once(
  p_request_id uuid,
  p_title text,
  p_start_date date,
  p_end_date date,
  p_cities text[],
  p_pace text default 'balanced',
  p_budget numeric default null,
  p_adults integer default 0,
  p_children integer default 0,
  p_seniors integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
  v_day_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_request_id is null then
    raise exception 'Request id is required';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'Trip title is required';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Invalid trip dates';
  end if;

  v_day_count := (p_end_date - p_start_date) + 1;
  if v_day_count > 30 then
    raise exception 'Trips longer than 30 days are not supported yet';
  end if;

  if p_pace not in ('relaxed', 'balanced', 'packed') then
    raise exception 'Invalid pace';
  end if;

  -- owner_id always comes from the authenticated JWT. The caller cannot supply it.
  insert into public.trips (
    owner_id, title, start_date, end_date, cities, pace, budget, currency, create_request_id
  )
  values (
    v_user_id, btrim(p_title), p_start_date, p_end_date,
    coalesce(p_cities, '{}'), p_pace, p_budget, 'THB', p_request_id
  )
  on conflict (owner_id, create_request_id) where create_request_id is not null
  do nothing
  returning id into v_trip_id;

  -- Idempotent retry: return the trip created by the first copy of this request.
  if v_trip_id is null then
    select t.id into v_trip_id
    from public.trips t
    where t.owner_id = v_user_id
      and t.create_request_id = p_request_id
    limit 1;

    if v_trip_id is null then
      raise exception 'Could not resolve idempotent trip request';
    end if;

    return v_trip_id;
  end if;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Adult ' || n, 'adult', 3, '{}'::text[]
  from generate_series(1, greatest(coalesce(p_adults, 0), 0)) as n;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Child ' || n, 'child', 2, array['พักเป็นระยะ']::text[]
  from generate_series(1, greatest(coalesce(p_children, 0), 0)) as n;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Senior ' || n, 'senior', 2, array['หลีกเลี่ยงบันได','พักเป็นระยะ']::text[]
  from generate_series(1, greatest(coalesce(p_seniors, 0), 0)) as n;

  insert into public.trip_days (trip_id, trip_date, title)
  select
    v_trip_id,
    d::date,
    'Day ' || row_number() over (order by d)
  from generate_series(p_start_date::timestamp, p_end_date::timestamp, interval '1 day') as d;

  return v_trip_id;
end;
$$;

-- Do not leave the SECURITY DEFINER RPC executable by anon/public.
revoke all on function public.create_trip_bundle_once(uuid,text,date,date,text[],text,numeric,integer,integer,integer) from public;
revoke all on function public.create_trip_bundle_once(uuid,text,date,date,text[],text,numeric,integer,integer,integer) from anon;
grant execute on function public.create_trip_bundle_once(uuid,text,date,date,text[],text,numeric,integer,integer,integer) to authenticated;
