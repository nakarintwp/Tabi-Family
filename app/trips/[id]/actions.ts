"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";

async function requireUser() {
  return requireVerifiedUser("/trips");
}

export async function addMember(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const name = String(formData.get("name") || "").trim();
  const memberType = String(formData.get("member_type") || "adult");
  const walkingLevel = Math.min(5, Math.max(1, Number(formData.get("walking_level") || 3)));
  const needs = String(formData.get("needs") || "").split(",").map((v) => v.trim()).filter(Boolean);
  if (!tripId || !name) return;

  await supabase.from("trip_members").insert({ trip_id: tripId, name, member_type: memberType, walking_level: walkingLevel, needs });
  revalidatePath(`/trips/${tripId}`);
}

export async function addActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const title = String(formData.get("title") || "").trim();
  const startTime = String(formData.get("start_time") || "").trim();
  const activityType = String(formData.get("activity_type") || "attraction");
  const locationName = String(formData.get("location_name") || "").trim();
  if (!tripId || !dayId || !title) return;

  const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("day_id", dayId);
  await supabase.from("activities").insert({
    day_id: dayId,
    title,
    activity_type: activityType,
    start_time: startTime || null,
    location_name: locationName || null,
    sort_order: count ?? 0,
  });
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/plan");
}

export async function addExpense(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const currency = String(formData.get("currency") || "JPY");
  const category = String(formData.get("category") || "other");
  const note = String(formData.get("note") || "").trim();
  if (!tripId || !Number.isFinite(amount) || amount <= 0) return;

  await supabase.from("expenses").insert({ trip_id: tripId, amount, currency, category, note: note || null, created_by: userId });
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/wallet");
}
export async function deleteTrip(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  if (!tripId) return;

  // RLS already restricts DELETE to the owner. The explicit owner_id filter is
  // an additional guard so this action can never delete another user's trip.
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("owner_id", userId);

  if (error) {
    throw new Error(`ลบทริปไม่สำเร็จ: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/trips");
  revalidatePath("/plan");
  revalidatePath("/map");
  revalidatePath("/wallet");
  redirect("/trips?deleted=1");
}
