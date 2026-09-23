-- Tabi Family V7.3 — Trip Interests
-- Adds per-trip interest preferences used by Explore ranking/filtering.

alter table public.trips
  add column if not exists interests text[] not null default '{}';

create index if not exists idx_trips_interests_gin
  on public.trips using gin (interests);

comment on column public.trips.interests is
  'User-selected trip interests such as snow, theme-park, shopping, sightseeing, market, food, museum, nature, train, culture, kids, onsen.';
