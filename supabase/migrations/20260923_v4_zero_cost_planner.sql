-- Tabi Family V4 — Zero-cost planner features
-- Day Planner Pro + Google Maps links (no API key) + Packing + Booking Wallet + Expenses
-- Safe to rerun after V3.2.

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
for all
using (exists(select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
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
