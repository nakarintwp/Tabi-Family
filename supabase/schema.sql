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
