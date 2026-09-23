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
