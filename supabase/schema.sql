-- Tabi Family / Japan Family Trip Planner
-- Safe to run in Supabase SQL Editor. Tables are created only if missing.

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  cities text[] not null default '{}',
  pace text not null default 'balanced' check (pace in ('relaxed','balanced','packed')),
  budget numeric(12,2),
  currency text not null default 'THB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  member_type text not null default 'adult' check (member_type in ('adult','child','senior')),
  walking_level int not null default 3 check (walking_level between 1 and 5),
  needs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_date date not null,
  title text,
  notes text,
  unique(trip_id, trip_date)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.trip_days(id) on delete cascade,
  title text not null,
  activity_type text not null default 'attraction',
  start_time time,
  duration_minutes int,
  location_name text,
  latitude double precision,
  longitude double precision,
  reservation_required boolean not null default false,
  child_friendly boolean not null default true,
  senior_friendly boolean not null default true,
  sort_order int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  booking_type text not null,
  provider text,
  reference_code text,
  start_at timestamptz,
  end_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default 'other',
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'JPY',
  paid_at timestamptz not null default now(),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at before update on public.trips
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;
alter table public.activities enable row level security;
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "owners manage trips" on public.trips;
create policy "owners manage trips" on public.trips
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owners manage trip members" on public.trip_members;
create policy "owners manage trip members" on public.trip_members
for all using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

drop policy if exists "owners manage trip days" on public.trip_days;
create policy "owners manage trip days" on public.trip_days
for all using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

drop policy if exists "owners manage activities" on public.activities;
create policy "owners manage activities" on public.activities
for all using (exists(
  select 1 from public.trip_days d join public.trips t on t.id = d.trip_id
  where d.id = day_id and t.owner_id = auth.uid()
)) with check (exists(
  select 1 from public.trip_days d join public.trips t on t.id = d.trip_id
  where d.id = day_id and t.owner_id = auth.uid()
));

drop policy if exists "owners manage bookings" on public.bookings;
create policy "owners manage bookings" on public.bookings
for all using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

drop policy if exists "owners manage expenses" on public.expenses;
create policy "owners manage expenses" on public.expenses
for all using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

create index if not exists idx_trips_owner on public.trips(owner_id);
create index if not exists idx_trip_days_trip on public.trip_days(trip_id, trip_date);
create index if not exists idx_trip_members_trip on public.trip_members(trip_id);
create index if not exists idx_activities_day on public.activities(day_id, sort_order);
create index if not exists idx_bookings_trip on public.bookings(trip_id);
create index if not exists idx_expenses_trip on public.expenses(trip_id, paid_at desc);

-- V2: fast transactional trip creation. Safe to rerun.
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
  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Child ' || n, 'child', 2, array['พักเป็นระยะ']::text[] from generate_series(1, greatest(coalesce(p_children, 0), 0)) as n;
  insert into public.trip_members (trip_id, name, member_type, walking_level, needs)
  select v_trip_id, 'Senior ' || n, 'senior', 2, array['หลีกเลี่ยงบันได','พักเป็นระยะ']::text[] from generate_series(1, greatest(coalesce(p_seniors, 0), 0)) as n;

  insert into public.trip_days (trip_id, trip_date, title)
  select v_trip_id, d::date, 'Day ' || row_number() over (order by d)
  from generate_series(p_start_date::timestamp, p_end_date::timestamp, interval '1 day') as d;

  return v_trip_id;
end;
$$;

grant execute on function public.create_trip_bundle(text,date,date,text[],text,numeric,integer,integer,integer) to authenticated;

-- V3: richer family profiles + place metadata. Safe to rerun.
alter table public.trip_members add column if not exists age integer;
alter table public.trip_members add column if not exists dietary_preferences text[] not null default '{}';
alter table public.trip_members add column if not exists interests text[] not null default '{}';
alter table public.trip_members add column if not exists mobility_notes text;
alter table public.trip_members add column if not exists avoid_stairs boolean not null default false;
alter table public.trip_members add column if not exists needs_frequent_rest boolean not null default false;
alter table public.trip_members add column if not exists stroller boolean not null default false;
alter table public.trip_members add column if not exists notes text;
alter table public.activities add column if not exists place_id text;
create index if not exists idx_activities_coordinates on public.activities(latitude, longitude) where latitude is not null and longitude is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trip_members_age_check') then
    alter table public.trip_members add constraint trip_members_age_check check (age is null or (age between 0 and 120));
  end if;
end $$;

-- V3 bundle creator defaults for child/senior family constraints.
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
  select v_trip_id, 'Child ' || n, 'child', 2, array['พักเป็นระยะ']::text[], true from generate_series(1, greatest(coalesce(p_children, 0), 0)) as n;
  insert into public.trip_members (trip_id, name, member_type, walking_level, needs, avoid_stairs, needs_frequent_rest)
  select v_trip_id, 'Senior ' || n, 'senior', 2, array['หลีกเลี่ยงบันได','พักเป็นระยะ']::text[], true, true from generate_series(1, greatest(coalesce(p_seniors, 0), 0)) as n;

  insert into public.trip_days (trip_id, trip_date, title)
  select v_trip_id, d::date, 'Day ' || row_number() over (order by d)
  from generate_series(p_start_date::timestamp, p_end_date::timestamp, interval '1 day') as d;

  return v_trip_id;
end;
$$;

grant execute on function public.create_trip_bundle(text,date,date,text[],text,numeric,integer,integer,integer) to authenticated;


-- V4: Zero-cost planner additions
alter table public.activities add column if not exists maps_url text;
alter table public.bookings add column if not exists title text;
alter table public.bookings add column if not exists confirmation_url text;
alter table public.bookings add column if not exists notes text;

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  category text not null default 'other',
  assigned_to text,
  quantity integer not null default 1 check (quantity between 1 and 99),
  is_packed boolean not null default false,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.packing_items enable row level security;
drop policy if exists "owners manage packing items" on public.packing_items;
create policy "owners manage packing items" on public.packing_items
for all using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
with check (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));
create index if not exists idx_packing_items_trip on public.packing_items(trip_id, sort_order, created_at);

create or replace function public.seed_packing_list(p_trip_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.trips where id = p_trip_id and owner_id = v_user_id) then
    raise exception 'Trip not found';
  end if;

  select count(*)::integer into v_count from public.packing_items where trip_id = p_trip_id;
  if v_count > 0 then return 0; end if;

  insert into public.packing_items (trip_id, label, category, quantity, sort_order)
  values
    (p_trip_id, 'Passport', 'documents', 1, 1),
    (p_trip_id, 'Travel insurance', 'documents', 1, 2),
    (p_trip_id, 'ตั๋วเครื่องบิน / Booking', 'documents', 1, 3),
    (p_trip_id, 'ยาประจำตัว', 'health', 1, 4),
    (p_trip_id, 'Power bank', 'electronics', 1, 5),
    (p_trip_id, 'สายชาร์จ', 'electronics', 1, 6),
    (p_trip_id, 'Universal adapter', 'electronics', 1, 7),
    (p_trip_id, 'เสื้อกันหนาว', 'clothes', 1, 8),
    (p_trip_id, 'ร่มพับ', 'other', 1, 9);

  return 9;
end;
$$;

grant execute on function public.seed_packing_list(uuid) to authenticated;


-- V4.3: Email/password + QR family sharing + collaborator roles
-- Tabi Family V4.3
-- Email/password auth is configured in Supabase Dashboard (no database change required).
-- This migration adds QR invite sharing, collaborators, and role-aware RLS.
-- Safe to run on top of V4/V4.2.

create extension if not exists pgcrypto;

create table if not exists public.trip_collaborators (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('editor','viewer')),
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token text not null unique default gen_random_uuid()::text,
  role text not null default 'viewer' check (role in ('editor','viewer')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses integer not null default 5 check (max_uses between 1 and 100),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_collaborators_user on public.trip_collaborators(user_id, trip_id);
create index if not exists idx_trip_collaborators_trip on public.trip_collaborators(trip_id, role);
create index if not exists idx_trip_invites_trip on public.trip_invites(trip_id, created_at desc);
create index if not exists idx_trip_invites_token on public.trip_invites(token);

alter table public.trip_collaborators enable row level security;
alter table public.trip_invites enable row level security;

-- Security-definer helpers avoid recursive RLS checks while keeping access rules centralized.
create or replace function public.trip_access_role(p_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then null
    when exists (
      select 1 from public.trips t
      where t.id = p_trip_id and t.owner_id = auth.uid()
    ) then 'owner'
    else (
      select c.role
      from public.trip_collaborators c
      where c.trip_id = p_trip_id and c.user_id = auth.uid()
      limit 1
    )
  end;
$$;

create or replace function public.can_view_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.trip_access_role(p_trip_id) is not null;
$$;

create or replace function public.can_edit_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.trip_access_role(p_trip_id) in ('owner','editor');
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.trip_access_role(p_trip_id) = 'owner';
$$;

create or replace function public.trip_id_for_day(p_day_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.trip_id from public.trip_days d where d.id = p_day_id limit 1;
$$;

grant execute on function public.trip_access_role(uuid) to authenticated;
grant execute on function public.can_view_trip(uuid) to authenticated;
grant execute on function public.can_edit_trip(uuid) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.trip_id_for_day(uuid) to authenticated;

-- Replace owner-only policies with owner/editor/viewer-aware policies.
drop policy if exists "owners manage trips" on public.trips;
drop policy if exists "trip select by access" on public.trips;
drop policy if exists "trip insert by owner" on public.trips;
drop policy if exists "trip update by owner" on public.trips;
drop policy if exists "trip delete by owner" on public.trips;
create policy "trip select by access" on public.trips for select using (public.can_view_trip(id));
create policy "trip insert by owner" on public.trips for insert with check (auth.uid() = owner_id);
create policy "trip update by owner" on public.trips for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "trip delete by owner" on public.trips for delete using (auth.uid() = owner_id);

drop policy if exists "owners manage trip members" on public.trip_members;
drop policy if exists "trip members select by access" on public.trip_members;
drop policy if exists "trip members write by editors" on public.trip_members;
create policy "trip members select by access" on public.trip_members for select using (public.can_view_trip(trip_id));
create policy "trip members write by editors" on public.trip_members for all using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

drop policy if exists "owners manage trip days" on public.trip_days;
drop policy if exists "trip days select by access" on public.trip_days;
drop policy if exists "trip days write by editors" on public.trip_days;
create policy "trip days select by access" on public.trip_days for select using (public.can_view_trip(trip_id));
create policy "trip days write by editors" on public.trip_days for all using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

drop policy if exists "owners manage activities" on public.activities;
drop policy if exists "activities select by access" on public.activities;
drop policy if exists "activities write by editors" on public.activities;
create policy "activities select by access" on public.activities for select using (public.can_view_trip(public.trip_id_for_day(day_id)));
create policy "activities write by editors" on public.activities for all using (public.can_edit_trip(public.trip_id_for_day(day_id))) with check (public.can_edit_trip(public.trip_id_for_day(day_id)));

drop policy if exists "owners manage bookings" on public.bookings;
drop policy if exists "bookings select by access" on public.bookings;
drop policy if exists "bookings write by editors" on public.bookings;
create policy "bookings select by access" on public.bookings for select using (public.can_view_trip(trip_id));
create policy "bookings write by editors" on public.bookings for all using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

drop policy if exists "owners manage expenses" on public.expenses;
drop policy if exists "expenses select by access" on public.expenses;
drop policy if exists "expenses write by editors" on public.expenses;
create policy "expenses select by access" on public.expenses for select using (public.can_view_trip(trip_id));
create policy "expenses write by editors" on public.expenses for all using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

do $$
begin
  if to_regclass('public.packing_items') is not null then
    execute 'drop policy if exists "owners manage packing items" on public.packing_items';
    execute 'drop policy if exists "packing select by access" on public.packing_items';
    execute 'drop policy if exists "packing write by editors" on public.packing_items';
    execute 'create policy "packing select by access" on public.packing_items for select using (public.can_view_trip(trip_id))';
    execute 'create policy "packing write by editors" on public.packing_items for all using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id))';
  end if;
end $$;

-- Collaborators can read their own membership; owners can read/manage all memberships for their trip.
drop policy if exists "collaborators read membership" on public.trip_collaborators;
drop policy if exists "owners insert collaborators" on public.trip_collaborators;
drop policy if exists "owners update collaborators" on public.trip_collaborators;
drop policy if exists "owners or self remove collaborators" on public.trip_collaborators;
create policy "collaborators read membership" on public.trip_collaborators
for select using (user_id = auth.uid() or public.is_trip_owner(trip_id));
create policy "owners insert collaborators" on public.trip_collaborators
for insert with check (public.is_trip_owner(trip_id));
create policy "owners update collaborators" on public.trip_collaborators
for update using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));
create policy "owners or self remove collaborators" on public.trip_collaborators
for delete using (user_id = auth.uid() or public.is_trip_owner(trip_id));

-- Invite rows are owner-only. Token holders access them only through narrowly scoped RPC functions below.
drop policy if exists "owners manage trip invites" on public.trip_invites;
create policy "owners manage trip invites" on public.trip_invites
for all using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id) and created_by = auth.uid());

-- Public preview for someone holding an invite token. It exposes only trip title + invite role/status.
create or replace function public.get_trip_invite_preview(p_token text)
returns table (
  trip_id uuid,
  trip_title text,
  invite_role text,
  expires_at timestamptz,
  available boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select i.trip_id,
         t.title,
         i.role,
         i.expires_at,
         (i.revoked_at is null and i.expires_at > now() and i.use_count < i.max_uses) as available
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.token = p_token
  limit 1;
$$;

grant execute on function public.get_trip_invite_preview(text) to anon, authenticated;

-- Accepting an invite is atomic and idempotent for an already joined user.
create or replace function public.accept_trip_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.trip_invites%rowtype;
  v_owner uuid;
  v_existing_role text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_invite
  from public.trip_invites
  where token = p_token
    and revoked_at is null
    and expires_at > now()
    and use_count < max_uses
  for update;

  if v_invite.id is null then raise exception 'Invite is invalid, expired, revoked, or fully used'; end if;

  select owner_id into v_owner from public.trips where id = v_invite.trip_id;
  if v_owner = v_user then return v_invite.trip_id; end if;

  select role into v_existing_role
  from public.trip_collaborators
  where trip_id = v_invite.trip_id and user_id = v_user;

  insert into public.trip_collaborators (trip_id, user_id, role)
  values (v_invite.trip_id, v_user, v_invite.role)
  on conflict (trip_id, user_id) do update
  set role = case
    when trip_collaborators.role = 'editor' or excluded.role = 'editor' then 'editor'
    else 'viewer'
  end;

  -- Count only a first join or an actual role upgrade, not repeated scans by the same user.
  if v_existing_role is null or (v_existing_role = 'viewer' and v_invite.role = 'editor') then
    update public.trip_invites set use_count = use_count + 1 where id = v_invite.id;
  end if;

  return v_invite.trip_id;
end;
$$;

grant execute on function public.accept_trip_invite(text) to authenticated;

-- Owner-only member list with email from auth.users. auth.users itself is never exposed.
create or replace function public.get_trip_collaborators(p_trip_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Owner access required';
  end if;

  return query
  select c.user_id, u.email::text, c.role, c.joined_at
  from public.trip_collaborators c
  join auth.users u on u.id = c.user_id
  where c.trip_id = p_trip_id
  order by c.joined_at;
end;
$$;

grant execute on function public.get_trip_collaborators(uuid) to authenticated;

-- Update V4 packing seeder so editors can also prepare the shared packing list.
create or replace function public.seed_packing_list(p_trip_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.can_edit_trip(p_trip_id) then raise exception 'Edit access required'; end if;

  select count(*)::integer into v_count from public.packing_items where trip_id = p_trip_id;
  if v_count > 0 then return 0; end if;

  insert into public.packing_items (trip_id, label, category, quantity, sort_order)
  values
    (p_trip_id, 'Passport', 'documents', 1, 1),
    (p_trip_id, 'Travel insurance', 'documents', 1, 2),
    (p_trip_id, 'ตั๋วเครื่องบิน / Booking', 'documents', 1, 3),
    (p_trip_id, 'ยาประจำตัว', 'health', 1, 4),
    (p_trip_id, 'Power bank', 'electronics', 1, 5),
    (p_trip_id, 'สายชาร์จ', 'electronics', 1, 6),
    (p_trip_id, 'Universal adapter', 'electronics', 1, 7),
    (p_trip_id, 'เสื้อกันหนาว', 'clothes', 1, 8),
    (p_trip_id, 'ร่มพับ', 'other', 1, 9);

  return 9;
end;
$$;

grant execute on function public.seed_packing_list(uuid) to authenticated;


-- ===== V6 Complete Trip Experience =====
-- Tabi Family V6 — PWA/Offline, Today Pro, Collaboration activity log, Export support, Weather/Rain Plan
-- Safe to run on top of V5.1 / V4.3.2.

alter table public.activities add column if not exists status text not null default 'planned';
alter table public.activities drop constraint if exists activities_status_check;
alter table public.activities add constraint activities_status_check check (status in ('planned','done','skipped'));
alter table public.activities add column if not exists completed_at timestamptz;
alter table public.activities add column if not exists is_outdoor boolean not null default false;
alter table public.activities add column if not exists rain_alternative text;

create index if not exists idx_activities_status on public.activities(day_id, status, sort_order);

create table if not exists public.trip_activity_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_activity_log_trip on public.trip_activity_log(trip_id, created_at desc);
alter table public.trip_activity_log enable row level security;

drop policy if exists "activity log select by access" on public.trip_activity_log;
create policy "activity log select by access" on public.trip_activity_log
for select using (public.can_view_trip(trip_id));

-- Users never insert logs directly. Triggers below write through SECURITY DEFINER.
revoke insert, update, delete on public.trip_activity_log from anon, authenticated;
grant select on public.trip_activity_log to authenticated;

create or replace function public.log_trip_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_entity_id uuid;
  v_summary text;
  v_action text := lower(tg_op);
  v_day_id uuid;
begin
  if tg_table_name = 'trip_days' then
    if tg_op = 'DELETE' then
      v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบวันเดินทาง';
    elsif tg_op = 'INSERT' then
      v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มวันเดินทาง';
    else
      v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขวันเดินทาง';
    end if;
  elsif tg_table_name = 'activities' then
    if tg_op = 'DELETE' then
      v_day_id := old.day_id; v_entity_id := old.id; v_summary := 'ลบกิจกรรม: ' || coalesce(old.title,'');
    elsif tg_op = 'INSERT' then
      v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'เพิ่มกิจกรรม: ' || coalesce(new.title,'');
    else
      v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'แก้ไขกิจกรรม: ' || coalesce(new.title,'');
    end if;
    select d.trip_id into v_trip_id from public.trip_days d where d.id = v_day_id limit 1;
  elsif tg_table_name = 'packing_items' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Packing: ' || coalesce(old.label,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Packing: ' || coalesce(new.label,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'อัปเดต Packing: ' || coalesce(new.label,''); end if;
  elsif tg_table_name = 'bookings' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Booking';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Booking: ' || coalesce(new.title,new.provider,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไข Booking: ' || coalesce(new.title,new.provider,''); end if;
  elsif tg_table_name = 'expenses' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบค่าใช้จ่าย';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มค่าใช้จ่าย ' || coalesce(new.amount::text,'') || ' ' || coalesce(new.currency,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขค่าใช้จ่าย'; end if;
  elsif tg_table_name = 'trip_collaborators' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'นำสมาชิกออกจากทริป';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'สมาชิกเข้าร่วมทริป';
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เปลี่ยนสิทธิ์สมาชิกเป็น ' || coalesce(new.role,''); end if;
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if v_trip_id is not null then
    insert into public.trip_activity_log(trip_id, actor_id, action, entity_type, entity_id, summary)
    values (v_trip_id, auth.uid(), v_action, tg_table_name, v_entity_id, v_summary);
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

-- Recreate audit triggers idempotently.
drop trigger if exists audit_trip_days on public.trip_days;
create trigger audit_trip_days after insert or update or delete on public.trip_days for each row execute function public.log_trip_change();

drop trigger if exists audit_activities on public.activities;
create trigger audit_activities after insert or update or delete on public.activities for each row execute function public.log_trip_change();

drop trigger if exists audit_packing_items on public.packing_items;
create trigger audit_packing_items after insert or update or delete on public.packing_items for each row execute function public.log_trip_change();

drop trigger if exists audit_bookings on public.bookings;
create trigger audit_bookings after insert or update or delete on public.bookings for each row execute function public.log_trip_change();

drop trigger if exists audit_expenses on public.expenses;
create trigger audit_expenses after insert or update or delete on public.expenses for each row execute function public.log_trip_change();

drop trigger if exists audit_collaborators on public.trip_collaborators;
create trigger audit_collaborators after insert or update or delete on public.trip_collaborators for each row execute function public.log_trip_change();

-- Owner-only activity feed with collaborator emails where available.
create or replace function public.get_trip_activity_feed(p_trip_id uuid, p_limit integer default 30)
returns table (
  id uuid,
  actor_id uuid,
  actor_email text,
  action text,
  entity_type text,
  summary text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select l.id,
         l.actor_id,
         case when l.actor_id is null then 'System' when l.actor_id = auth.uid() then 'คุณ' when public.is_trip_owner(p_trip_id) then coalesce(u.email::text, 'สมาชิก') else 'สมาชิก' end as actor_email,
         l.action,
         l.entity_type,
         l.summary,
         l.created_at
  from public.trip_activity_log l
  left join auth.users u on u.id = l.actor_id
  where l.trip_id = p_trip_id
    and public.can_view_trip(p_trip_id)
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit,30),100));
$$;

grant execute on function public.get_trip_activity_feed(uuid, integer) to authenticated;


-- ===== V7 Discovery & Planning =====
-- Tabi Family V7 — Discovery & Planning Experience
-- Explore/Wishlist, Templates metadata, Calendar support, Transport segments, Trip Cover and Readiness.
-- Safe to run on top of V6.2 / V4.3.2.

alter table public.trips add column if not exists cover_style text not null default 'sky';
alter table public.trips add column if not exists cover_emoji text not null default '🧳';
alter table public.trips add column if not exists cover_tagline text;
alter table public.trips add column if not exists template_key text;
alter table public.trips add column if not exists interests text[] not null default '{}';
create index if not exists idx_trips_interests_gin on public.trips using gin (interests);

create table if not exists public.trip_wishlist (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_key text not null,
  title text not null,
  city text,
  category text not null default 'attraction',
  emoji text,
  summary text,
  maps_url text,
  latitude double precision,
  longitude double precision,
  child_friendly boolean not null default true,
  senior_friendly boolean not null default true,
  is_outdoor boolean not null default false,
  duration_minutes integer,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (trip_id, place_key)
);

create table if not exists public.transport_segments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id uuid references public.trip_days(id) on delete set null,
  mode text not null default 'train' check (mode in ('train','bus','flight','car','walk','taxi','ferry','other')),
  operator text,
  service_name text,
  origin text not null,
  destination text not null,
  departure_time time,
  arrival_time time,
  reservation_required boolean not null default false,
  booking_reference text,
  seat text,
  notes text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_wishlist_trip on public.trip_wishlist(trip_id, created_at desc);
create index if not exists idx_trip_wishlist_city on public.trip_wishlist(trip_id, city);
create index if not exists idx_transport_segments_trip on public.transport_segments(trip_id, sort_order, created_at);
create index if not exists idx_transport_segments_day on public.transport_segments(day_id, departure_time);

alter table public.trip_wishlist enable row level security;
alter table public.transport_segments enable row level security;

drop policy if exists "wishlist select by access" on public.trip_wishlist;
drop policy if exists "wishlist write by editors" on public.trip_wishlist;
create policy "wishlist select by access" on public.trip_wishlist
for select using (public.can_view_trip(trip_id));
create policy "wishlist write by editors" on public.trip_wishlist
for all using (public.can_edit_trip(trip_id))
with check (public.can_edit_trip(trip_id));

drop policy if exists "transport select by access" on public.transport_segments;
drop policy if exists "transport write by editors" on public.transport_segments;
create policy "transport select by access" on public.transport_segments
for select using (public.can_view_trip(trip_id));
create policy "transport write by editors" on public.transport_segments
for all using (public.can_edit_trip(trip_id))
with check (public.can_edit_trip(trip_id));

-- Extend the V6 collaboration activity feed to include Wishlist and Transport changes.
create or replace function public.log_trip_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_entity_id uuid;
  v_summary text;
  v_action text := lower(tg_op);
  v_day_id uuid;
begin
  if tg_table_name = 'trip_days' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบวันเดินทาง';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มวันเดินทาง';
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขวันเดินทาง'; end if;
  elsif tg_table_name = 'activities' then
    if tg_op = 'DELETE' then v_day_id := old.day_id; v_entity_id := old.id; v_summary := 'ลบกิจกรรม: ' || coalesce(old.title,'');
    elsif tg_op = 'INSERT' then v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'เพิ่มกิจกรรม: ' || coalesce(new.title,'');
    else v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'แก้ไขกิจกรรม: ' || coalesce(new.title,''); end if;
    select d.trip_id into v_trip_id from public.trip_days d where d.id = v_day_id limit 1;
  elsif tg_table_name = 'packing_items' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Packing: ' || coalesce(old.label,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Packing: ' || coalesce(new.label,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'อัปเดต Packing: ' || coalesce(new.label,''); end if;
  elsif tg_table_name = 'bookings' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Booking';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Booking: ' || coalesce(new.title,new.provider,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไข Booking: ' || coalesce(new.title,new.provider,''); end if;
  elsif tg_table_name = 'expenses' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบค่าใช้จ่าย';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มค่าใช้จ่าย ' || coalesce(new.amount::text,'') || ' ' || coalesce(new.currency,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขค่าใช้จ่าย'; end if;
  elsif tg_table_name = 'trip_collaborators' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'นำสมาชิกออกจากทริป';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'สมาชิกเข้าร่วมทริป';
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เปลี่ยนสิทธิ์สมาชิกเป็น ' || coalesce(new.role,''); end if;
  elsif tg_table_name = 'trip_wishlist' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Wishlist: ' || coalesce(old.title,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'บันทึก Wishlist: ' || coalesce(new.title,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไข Wishlist: ' || coalesce(new.title,''); end if;
  elsif tg_table_name = 'transport_segments' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบการเดินทาง: ' || coalesce(old.origin,'') || ' → ' || coalesce(old.destination,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มการเดินทาง: ' || coalesce(new.origin,'') || ' → ' || coalesce(new.destination,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขการเดินทาง: ' || coalesce(new.origin,'') || ' → ' || coalesce(new.destination,''); end if;
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if v_trip_id is not null then
    insert into public.trip_activity_log(trip_id, actor_id, action, entity_type, entity_id, summary)
    values (v_trip_id, auth.uid(), v_action, tg_table_name, v_entity_id, v_summary);
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists audit_trip_wishlist on public.trip_wishlist;
create trigger audit_trip_wishlist after insert or update or delete on public.trip_wishlist
for each row execute function public.log_trip_change();

drop trigger if exists audit_transport_segments on public.transport_segments;
create trigger audit_transport_segments after insert or update or delete on public.transport_segments
for each row execute function public.log_trip_change();

grant select, insert, update, delete on public.trip_wishlist to authenticated;
grant select, insert, update, delete on public.transport_segments to authenticated;


-- ===== V7.2.1 Delete Trip Fix =====
-- Tabi Family V7.2.1 — Delete Trip hotfix
-- Fixes DELETE trips failing after V6/V7 audit triggers were added.
--
-- Why: deleting a trip cascades to trip_days / packing / bookings / expenses /
-- collaborators / wishlist / transport. Their AFTER DELETE audit triggers tried to
-- write a new trip_activity_log row for a trip that is itself being deleted.
-- This version logs normal child deletes, but skips audit writes when the parent
-- trip no longer exists (the cascade-delete case).

create or replace function public.log_trip_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_entity_id uuid;
  v_summary text;
  v_action text := lower(tg_op);
  v_day_id uuid;
begin
  if tg_table_name = 'trip_days' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบวันเดินทาง';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มวันเดินทาง';
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขวันเดินทาง'; end if;
  elsif tg_table_name = 'activities' then
    if tg_op = 'DELETE' then v_day_id := old.day_id; v_entity_id := old.id; v_summary := 'ลบกิจกรรม: ' || coalesce(old.title,'');
    elsif tg_op = 'INSERT' then v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'เพิ่มกิจกรรม: ' || coalesce(new.title,'');
    else v_day_id := new.day_id; v_entity_id := new.id; v_summary := 'แก้ไขกิจกรรม: ' || coalesce(new.title,''); end if;
    select d.trip_id into v_trip_id from public.trip_days d where d.id = v_day_id limit 1;
  elsif tg_table_name = 'packing_items' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Packing: ' || coalesce(old.label,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Packing: ' || coalesce(new.label,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'อัปเดต Packing: ' || coalesce(new.label,''); end if;
  elsif tg_table_name = 'bookings' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Booking';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่ม Booking: ' || coalesce(new.title,new.provider,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไข Booking: ' || coalesce(new.title,new.provider,''); end if;
  elsif tg_table_name = 'expenses' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบค่าใช้จ่าย';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มค่าใช้จ่าย ' || coalesce(new.amount::text,'') || ' ' || coalesce(new.currency,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขค่าใช้จ่าย'; end if;
  elsif tg_table_name = 'trip_collaborators' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'นำสมาชิกออกจากทริป';
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'สมาชิกเข้าร่วมทริป';
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เปลี่ยนสิทธิ์สมาชิกเป็น ' || coalesce(new.role,''); end if;
  elsif tg_table_name = 'trip_wishlist' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบ Wishlist: ' || coalesce(old.title,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'บันทึก Wishlist: ' || coalesce(new.title,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไข Wishlist: ' || coalesce(new.title,''); end if;
  elsif tg_table_name = 'transport_segments' then
    if tg_op = 'DELETE' then v_trip_id := old.trip_id; v_entity_id := old.id; v_summary := 'ลบการเดินทาง: ' || coalesce(old.origin,'') || ' → ' || coalesce(old.destination,'');
    elsif tg_op = 'INSERT' then v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'เพิ่มการเดินทาง: ' || coalesce(new.origin,'') || ' → ' || coalesce(new.destination,'');
    else v_trip_id := new.trip_id; v_entity_id := new.id; v_summary := 'แก้ไขการเดินทาง: ' || coalesce(new.origin,'') || ' → ' || coalesce(new.destination,''); end if;
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  -- IMPORTANT: During ON DELETE CASCADE the parent trip is already invisible to
  -- this statement. Do not create a fresh audit row for a trip being deleted.
  if v_trip_id is not null
     and exists (select 1 from public.trips t where t.id = v_trip_id) then
    begin
      insert into public.trip_activity_log(trip_id, actor_id, action, entity_type, entity_id, summary)
      values (v_trip_id, auth.uid(), v_action, tg_table_name, v_entity_id, v_summary);
    exception
      when foreign_key_violation then
        -- Defensive fallback for concurrent/cascade deletion.
        null;
    end;
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;


-- =========================================================
-- V8.9 — private Trip Documents storage
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-documents', 'trip-documents', false, 15728640,
  array[
    'application/pdf','image/jpeg','image/png','image/webp',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "trip documents read by trip members" on storage.objects;
create policy "trip documents read by trip members" on storage.objects for select to authenticated
using (bucket_id = 'trip-documents' and public.can_view_trip(((storage.foldername(name))[1])::uuid));

drop policy if exists "trip documents insert by trip editors" on storage.objects;
create policy "trip documents insert by trip editors" on storage.objects for insert to authenticated
with check (bucket_id = 'trip-documents' and public.can_edit_trip(((storage.foldername(name))[1])::uuid));

drop policy if exists "trip documents update by trip editors" on storage.objects;
create policy "trip documents update by trip editors" on storage.objects for update to authenticated
using (bucket_id = 'trip-documents' and public.can_edit_trip(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'trip-documents' and public.can_edit_trip(((storage.foldername(name))[1])::uuid));

drop policy if exists "trip documents delete by trip editors" on storage.objects;
create policy "trip documents delete by trip editors" on storage.objects for delete to authenticated
using (bucket_id = 'trip-documents' and public.can_edit_trip(((storage.foldername(name))[1])::uuid));

-- V9.4 — Family Travel Profiles
alter table public.trip_members add column if not exists passport_expiry date;
alter table public.trip_members add column if not exists seat_preference text;
alter table public.trip_members add column if not exists rail_pass text;
alter table public.trip_members add column if not exists child_seat boolean not null default false;
alter table public.trip_members add column if not exists booster_seat boolean not null default false;
alter table public.trip_members add column if not exists emergency_contact text;
alter table public.trip_members add column if not exists document_note text;
