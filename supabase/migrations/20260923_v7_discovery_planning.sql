-- Tabi Family V7 — Discovery & Planning Experience
-- Explore/Wishlist, Templates metadata, Calendar support, Transport segments, Trip Cover and Readiness.
-- Safe to run on top of V6.2 / V4.3.2.

alter table public.trips add column if not exists cover_style text not null default 'sky';
alter table public.trips add column if not exists cover_emoji text not null default '🧳';
alter table public.trips add column if not exists cover_tagline text;
alter table public.trips add column if not exists template_key text;

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
