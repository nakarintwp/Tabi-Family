-- Tabi Family V3: richer family profiles + place metadata
-- Safe to rerun.

alter table public.trip_members add column if not exists age integer;
alter table public.trip_members add column if not exists dietary_preferences text[] not null default '{}';
alter table public.trip_members add column if not exists interests text[] not null default '{}';
alter table public.trip_members add column if not exists mobility_notes text;
alter table public.trip_members add column if not exists avoid_stairs boolean not null default false;
alter table public.trip_members add column if not exists needs_frequent_rest boolean not null default false;
alter table public.trip_members add column if not exists stroller boolean not null default false;
alter table public.trip_members add column if not exists notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trip_members_age_check'
  ) then
    alter table public.trip_members add constraint trip_members_age_check check (age is null or (age between 0 and 120));
  end if;
end $$;

alter table public.activities add column if not exists place_id text;
create index if not exists idx_activities_coordinates on public.activities(latitude, longitude) where latitude is not null and longitude is not null;

-- Replace the V2 bundle creator so new default child/senior profiles are richer.
create or replace function public.create_trip_bundle(
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
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_title is null or btrim(p_title) = '' then raise exception 'Trip title is required'; end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then raise exception 'Invalid trip dates'; end if;
  v_day_count := (p_end_date - p_start_date) + 1;
  if v_day_count > 30 then raise exception 'Trips longer than 30 days are not supported yet'; end if;
  if p_pace not in ('relaxed', 'balanced', 'packed') then raise exception 'Invalid pace'; end if;

  insert into public.trips (owner_id, title, start_date, end_date, cities, pace, budget, currency)
  values (v_user_id, btrim(p_title), p_start_date, p_end_date, coalesce(p_cities, '{}'), p_pace, p_budget, 'THB')
  returning id into v_trip_id;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Adult ' || n, 'adult', 3, '{}' from generate_series(1, greatest(coalesce(p_adults, 0), 0)) as n;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs, needs_frequent_rest)
  select v_trip_id, 'Child ' || n, 'child', 2, array['พักเป็นระยะ']::text[], true
  from generate_series(1, greatest(coalesce(p_children, 0), 0)) as n;

  insert into public.trip_members (trip_id, name, member_type, walking_level, needs, avoid_stairs, needs_frequent_rest)
  select v_trip_id, 'Senior ' || n, 'senior', 2, array['หลีกเลี่ยงบันได','พักเป็นระยะ']::text[], true, true
  from generate_series(1, greatest(coalesce(p_seniors, 0), 0)) as n;

  insert into public.trip_days (trip_id, trip_date, title)
  select v_trip_id, d::date, 'Day ' || row_number() over (order by d)
  from generate_series(p_start_date::timestamp, p_end_date::timestamp, interval '1 day') as d;

  return v_trip_id;
end;
$$;

grant execute on function public.create_trip_bundle(text,date,date,text[],text,numeric,integer,integer,integer) to authenticated;
