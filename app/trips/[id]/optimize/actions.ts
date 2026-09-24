"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export async function applyOptimizedRoute(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const orderedIds = String(formData.get("ordered_ids") || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!tripId || !dayId || !orderedIds.length) return;
  const { supabase } = await requireVerifiedUser(`/trips/${tripId}/optimize`);
  const { data: day } = await supabase.from("trip_days").select("id").eq("id", dayId).eq("trip_id", tripId).maybeSingle();
  if (!day) throw new Error("ไม่พบวันที่อยู่ในทริปนี้");
  const { data: activities } = await supabase.from("activities").select("id").eq("day_id", dayId);
  const valid = new Set((activities || []).map((item: any) => item.id));
  if (orderedIds.some((id) => !valid.has(id)) || orderedIds.length !== valid.size) throw new Error("รายการกิจกรรมเปลี่ยนไปแล้ว กรุณารีเฟรชหน้าแล้วลองใหม่");
  const results = await Promise.all(orderedIds.map((activityId, index) => supabase.from("activities").update({ sort_order: index }).eq("id", activityId).eq("day_id", dayId)));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`เรียงเส้นทางไม่สำเร็จ: ${failed.error.message}`);
  for (const path of [`/trips/${tripId}`, `/trips/${tripId}/optimize`, `/trips/${tripId}/days/${dayId}`, `/trips/${tripId}/map`, "/today"]) revalidatePath(path);
}
