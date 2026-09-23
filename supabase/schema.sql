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
