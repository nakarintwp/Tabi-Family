"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export async function markActivityStatus(formData: FormData) {
  const activityId = String(formData.get("activity_id") || "");
  const tripId = String(formData.get("trip_id") || "");
  const statusRaw = String(formData.get("status") || "planned");
  const status = ["planned", "done", "skipped"].includes(statusRaw) ? statusRaw : "planned";
  if (!activityId || !tripId) return;
  const { supabase } = await requireVerifiedUser("/today");
  const { error } = await supabase.from("activities").update({
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  }).eq("id", activityId);
  if (error) throw new Error(`อัปเดตกิจกรรมไม่สำเร็จ: ${error.message}`);
  revalidatePath("/today");
  revalidatePath(`/trips/${tripId}`);
}

export async function postponeActivity(formData: FormData) {
  const activityId = String(formData.get("activity_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const tripId = String(formData.get("trip_id") || "");
  if (!activityId || !dayId || !tripId) return;
  const { supabase } = await requireVerifiedUser("/today");
  const { data: last } = await supabase.from("activities").select("sort_order").eq("day_id", dayId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("activities").update({ sort_order: Number(last?.sort_order ?? 0) + 1, start_time: null, status: "planned" }).eq("id", activityId).eq("day_id", dayId);
  if (error) throw new Error(`เลื่อนกิจกรรมไม่สำเร็จ: ${error.message}`);
  revalidatePath("/today");
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
}
