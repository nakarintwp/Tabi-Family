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

function paths(tripId: string, dayId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
  revalidatePath("/plan");
}

export async function addActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!tripId || !dayId || !title) return;

  const { data: last } = await supabase.from("activities").select("sort_order").eq("day_id", dayId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const duration = Number(formData.get("duration_minutes") || 0);

  await supabase.from("activities").insert({
    day_id: dayId,
    title,
    activity_type: String(formData.get("activity_type") || "attraction"),
    start_time: String(formData.get("start_time") || "") || null,
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
    location_name: String(formData.get("location_name") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    child_friendly: formData.get("child_friendly") === "on",
    senior_friendly: formData.get("senior_friendly") === "on",
    sort_order: Number(last?.sort_order ?? -1) + 1,
  });
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
  await supabase.from("activities").update({
    title,
    activity_type: String(formData.get("activity_type") || "attraction"),
    start_time: String(formData.get("start_time") || "") || null,
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
    location_name: String(formData.get("location_name") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    child_friendly: formData.get("child_friendly") === "on",
    senior_friendly: formData.get("senior_friendly") === "on",
  }).eq("id", activityId).eq("day_id", dayId);
  paths(tripId, dayId);
}

export async function deleteActivity(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const activityId = String(formData.get("activity_id") || "");
  if (!tripId || !dayId || !activityId) return;
  await supabase.from("activities").delete().eq("id", activityId).eq("day_id", dayId);
  paths(tripId, dayId);
}

export async function updateDay(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  if (!tripId || !dayId) return;
  await supabase.from("trip_days").update({
    title: String(formData.get("day_title") || "").trim() || null,
    notes: String(formData.get("day_notes") || "").trim() || null,
  }).eq("id", dayId).eq("trip_id", tripId);
  paths(tripId, dayId);
}
