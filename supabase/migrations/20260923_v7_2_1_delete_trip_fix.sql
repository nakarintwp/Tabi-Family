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
