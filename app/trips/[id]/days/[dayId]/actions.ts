"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/auth/login");
  return supabase;
}

function paths(tripId: string, dayId?: string) {
  revalidatePath(`/trips/${tripId}`);
  if (dayId) revalidatePath(`/trips/${tripId}/days/${dayId}`);
  revalidatePath(`/trips/${tripId}/map`);
  revalidatePath("/plan");
  revalidatePath("/map");
}

function nullableCoordinate(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>, dayId: string) {
  const { data: last } = await supabase
    .from("activities")
    .select("sort_order")
    .eq("day_id", dayId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(last?.sort_order ?? -1) + 1;
}

export async function addActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!tripId || !dayId || !title) return;

  const duration = Number(formData.get("duration_minutes") || 0);
  const sortOrder = await nextSortOrder(supabase, dayId);

  const { error } = await supabase.from("activities").insert({
    day_id: dayId,
    title,
    activity_type: String(formData.get("activity_type") || "attraction"),
    start_time: textOrNull(formData.get("start_time")),
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
    location_name: textOrNull(formData.get("location_name")),
    maps_url: textOrNull(formData.get("maps_url")),
    latitude: nullableCoordinate(formData.get("latitude")),
    longitude: nullableCoordinate(formData.get("longitude")),
    notes: textOrNull(formData.get("notes")),
    child_friendly: formData.get("child_friendly") === "on",
    senior_friendly: formData.get("senior_friendly") === "on",
    sort_order: sortOrder,
  });
  if (error) throw new Error(`เพิ่มกิจกรรมไม่สำเร็จ: ${error.message}`);
  paths(tripId, dayId);
}

export async function updateActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!tripId || !dayId || !activityId || !title) return;

  const duration = Number(formData.get("duration_minutes") || 0);
  const { error } = await supabase.from("activities").update({
    title,
    activity_type: String(formData.get("activity_type") || "attraction"),
    start_time: textOrNull(formData.get("start_time")),
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
    location_name: textOrNull(formData.get("location_name")),
    maps_url: textOrNull(formData.get("maps_url")),
    latitude: nullableCoordinate(formData.get("latitude")),
    longitude: nullableCoordinate(formData.get("longitude")),
    notes: textOrNull(formData.get("notes")),
    child_friendly: formData.get("child_friendly") === "on",
    senior_friendly: formData.get("senior_friendly") === "on",
  }).eq("id", activityId).eq("day_id", dayId);
  if (error) throw new Error(`แก้ไขกิจกรรมไม่สำเร็จ: ${error.message}`);
  paths(tripId, dayId);
}

export async function deleteActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  if (!tripId || !dayId || !activityId) return;
  const { error } = await supabase.from("activities").delete().eq("id", activityId).eq("day_id", dayId);
  if (error) throw new Error(`ลบกิจกรรมไม่สำเร็จ: ${error.message}`);
  paths(tripId, dayId);
}

export async function reorderActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  const direction = String(formData.get("direction") || "up");
  if (!tripId || !dayId || !activityId) return;

  const { data: rows, error } = await supabase
    .from("activities")
    .select("id,sort_order,created_at")
    .eq("day_id", dayId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !rows?.length) return;

  const index = rows.findIndex((row) => row.id === activityId);
  const targetIndex = direction === "down" ? index + 1 : index - 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return;

  const normalized = rows.map((row, idx) => ({ id: row.id, order: idx }));
  const a = normalized[index];
  const b = normalized[targetIndex];
  await supabase.from("activities").update({ sort_order: 999999 }).eq("id", a.id);
  await supabase.from("activities").update({ sort_order: a.order }).eq("id", b.id);
  await supabase.from("activities").update({ sort_order: b.order }).eq("id", a.id);
  paths(tripId, dayId);
}

export async function duplicateActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  if (!tripId || !dayId || !activityId) return;

  const { data: source, error } = await supabase
    .from("activities")
    .select("title,activity_type,start_time,duration_minutes,location_name,maps_url,latitude,longitude,reservation_required,child_friendly,senior_friendly,notes")
    .eq("id", activityId)
    .eq("day_id", dayId)
    .single();
  if (error || !source) return;

  const sortOrder = await nextSortOrder(supabase, dayId);
  const { error: insertError } = await supabase.from("activities").insert({ ...source, day_id: dayId, sort_order: sortOrder });
  if (insertError) throw new Error(`คัดลอกกิจกรรมไม่สำเร็จ: ${insertError.message}`);
  paths(tripId, dayId);
}

export async function moveActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const sourceDayId = String(formData.get("day_id") || "");
  const targetDayId = String(formData.get("target_day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  if (!tripId || !sourceDayId || !targetDayId || !activityId || sourceDayId === targetDayId) return;

  const { data: targetDay } = await supabase.from("trip_days").select("id").eq("id", targetDayId).eq("trip_id", tripId).maybeSingle();
  if (!targetDay) return;
  const sortOrder = await nextSortOrder(supabase, targetDayId);
  const { error } = await supabase.from("activities").update({ day_id: targetDayId, sort_order: sortOrder }).eq("id", activityId).eq("day_id", sourceDayId);
  if (error) throw new Error(`ย้ายกิจกรรมไม่สำเร็จ: ${error.message}`);
  paths(tripId, sourceDayId);
  paths(tripId, targetDayId);
}

export async function copyDayPlan(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const sourceDayId = String(formData.get("day_id") || "");
  const targetDayId = String(formData.get("target_day_id") || "");
  if (!tripId || !sourceDayId || !targetDayId || sourceDayId === targetDayId) return;

  const [{ data: sourceRows }, { data: targetDay }] = await Promise.all([
    supabase.from("activities").select("title,activity_type,start_time,duration_minutes,location_name,maps_url,latitude,longitude,reservation_required,child_friendly,senior_friendly,notes,sort_order").eq("day_id", sourceDayId).order("sort_order"),
    supabase.from("trip_days").select("id").eq("id", targetDayId).eq("trip_id", tripId).maybeSingle(),
  ]);
  if (!targetDay || !sourceRows?.length) return;

  const start = await nextSortOrder(supabase, targetDayId);
  const rows = sourceRows.map((item, index) => ({ ...item, day_id: targetDayId, sort_order: start + index }));
  const { error } = await supabase.from("activities").insert(rows);
  if (error) throw new Error(`คัดลอกแผนทั้งวันไม่สำเร็จ: ${error.message}`);
  paths(tripId, sourceDayId);
  paths(tripId, targetDayId);
}

export async function updateDay(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  if (!tripId || !dayId) return;
  const { error } = await supabase.from("trip_days").update({
    title: textOrNull(formData.get("day_title")),
    notes: textOrNull(formData.get("day_notes")),
  }).eq("id", dayId).eq("trip_id", tripId);
  if (error) throw new Error(`บันทึกวันไม่สำเร็จ: ${error.message}`);
  paths(tripId, dayId);
}
