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

export async function shiftRemainingActivities(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const fromTime = String(formData.get("from_time") || "00:00").slice(0, 5);
  const minutesRaw = Number(formData.get("minutes") || 0);
  const minutes = Math.max(-120, Math.min(180, Math.round(minutesRaw)));
  if (!tripId || !dayId || !minutes) return;
  const { supabase } = await requireVerifiedUser("/today");
  const { data: day } = await supabase.from("trip_days").select("id").eq("id", dayId).eq("trip_id", tripId).maybeSingle();
  if (!day) throw new Error("ไม่พบวันเดินทางในทริปนี้");
  const { data: activities, error: readError } = await supabase.from("activities").select("id,start_time,status").eq("day_id", dayId);
  if (readError) throw new Error(`อ่านตารางวันนี้ไม่สำเร็จ: ${readError.message}`);
  const toMinutes = (value: string | null) => { if (!value) return null; const [h,m]=value.slice(0,5).split(":").map(Number); return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null; };
  const threshold = toMinutes(fromTime) ?? 0;
  const updates = (activities || []).filter((item: any) => (item.status || "planned") === "planned" && toMinutes(item.start_time) != null && (toMinutes(item.start_time) as number) >= threshold).map((item: any) => {
    const current = toMinutes(item.start_time) as number;
    const shifted = Math.max(0, Math.min(1439, current + minutes));
    const next = `${String(Math.floor(shifted / 60)).padStart(2, "0")}:${String(shifted % 60).padStart(2, "0")}`;
    return supabase.from("activities").update({ start_time: next }).eq("id", item.id).eq("day_id", dayId);
  });
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`ปรับเวลาไม่สำเร็จ: ${failed.error.message}`);
  revalidatePath("/today");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
  revalidatePath(`/trips/${tripId}/timeline`);
  revalidatePath(`/trips/${tripId}/conflicts`);
}
