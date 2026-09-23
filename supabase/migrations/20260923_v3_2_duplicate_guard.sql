-- Tabi Family V3.2 — duplicate-trip guard + safe cleanup helper
-- Run once in Supabase SQL Editor after V3/V3.1.

alter table public.trips
  add column if not exists create_request_id uuid;

create unique index if not exists trips_owner_create_request_uidx
  on public.trips(owner_id, create_request_id)
  where create_request_id is not null;

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
security invoker
set search_path = public
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

  -- Same form submission can arrive more than once. Only the first creates rows.
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

  if v_trip_id is null then
    select id into v_trip_id
    from public.trips
    where owner_id = v_user_id
      and create_request_id = p_request_id
    limit 1;

    if v_trip_id is null then
      raise exception 'Could not resolve idempotent trip request';
    end if;

    return v_trip_id;
  end if;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Adult ' || n, 'adult', 3, '{}'
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

grant execute on function public.create_trip_bundle_once(uuid,text,date,date,text[],text,numeric,integer,integer,integer) to authenticated;

-- Deletes only exact-looking duplicates that belong to the currently signed-in user.
-- Keeps the oldest record in each duplicate group. Child rows disappear via ON DELETE CASCADE.
create or replace function public.remove_my_duplicate_trips()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  with ranked as (
    select
      id,
      row_number() over (
        partition by
          owner_id,
          lower(btrim(title)),
          start_date,
          end_date,
          cities,
          pace,
          budget,
          currency
        order by created_at asc, id asc
      ) as rn
    from public.trips
    where owner_id = v_user_id
  ), deleted as (
    delete from public.trips t
    using ranked r
    where t.id = r.id
      and r.rn > 1
    returning t.id
  )
  select count(*)::integer into v_deleted from deleted;

  return coalesce(v_deleted, 0);
end;
$$;

grant execute on function public.remove_my_duplicate_trips() to authenticated;
