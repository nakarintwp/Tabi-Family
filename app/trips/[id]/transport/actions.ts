"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

const modes = new Set(["train","bus","flight","car","walk","taxi","ferry","other"]);

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/transport`);
  revalidatePath(`/trips/${tripId}/calendar`);
  revalidatePath(`/trips/${tripId}/route`);
  revalidatePath(`/trips/${tripId}/rental-car`);
  revalidatePath(`/trips/${tripId}/conflicts`);
  revalidatePath(`/trips/${tripId}/master-plan`);
  revalidatePath(`/today`);
}

async function validDay(supabase: any, tripId: string, dayId: string | null) {
  if (!dayId) return null;
  const { data } = await supabase.from("trip_days").select("id").eq("id", dayId).eq("trip_id", tripId).maybeSingle();
  return data?.id || null;
}

export async function addTransportSegment(formData: FormData) {
  const { supabase, userId } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const origin = String(formData.get("origin") || "").trim();
  const destination = String(formData.get("destination") || "").trim();
  if (!tripId || !origin || !destination) return;
  const requestedDayId = String(formData.get("day_id") || "").trim() || null;
  const dayId = await validDay(supabase, tripId, requestedDayId);
  const modeRaw = String(formData.get("mode") || "train");
  const mode = modes.has(modeRaw) ? modeRaw : "other";
  const { count } = await supabase.from("transport_segments").select("id", { count: "exact", head: true }).eq("trip_id", tripId);
  const { error } = await supabase.from("transport_segments").insert({
    trip_id: tripId,
    day_id: dayId,
    mode,
    operator: String(formData.get("operator") || "").trim() || null,
    service_name: String(formData.get("service_name") || "").trim() || null,
    origin,
    destination,
    departure_time: String(formData.get("departure_time") || "").trim() || null,
    arrival_time: String(formData.get("arrival_time") || "").trim() || null,
    reservation_required: formData.get("reservation_required") === "on",
    booking_reference: String(formData.get("booking_reference") || "").trim() || null,
    seat: String(formData.get("seat") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    distance_km: Number(formData.get("distance_km") || 0) || null,
    toll_jpy: Number(formData.get("toll_jpy") || 0) || null,
    fuel_jpy: Number(formData.get("fuel_jpy") || 0) || null,
    parking_jpy: Number(formData.get("parking_jpy") || 0) || null,
    rest_stop: String(formData.get("rest_stop") || "").trim() || null,
    winter_ready: formData.get("winter_ready") === "on",
    sort_order: count || 0,
    created_by: userId,
  });
  if (error) throw new Error(`เพิ่มการเดินทางไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function updateTransportSegment(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const segmentId = String(formData.get("segment_id") || "");
  const origin = String(formData.get("origin") || "").trim();
  const destination = String(formData.get("destination") || "").trim();
  if (!tripId || !segmentId || !origin || !destination) return;
  const requestedDayId = String(formData.get("day_id") || "").trim() || null;
  const dayId = await validDay(supabase, tripId, requestedDayId);
  const modeRaw = String(formData.get("mode") || "train");
  const mode = modes.has(modeRaw) ? modeRaw : "other";
  const { error } = await supabase.from("transport_segments").update({
    day_id: dayId,
    mode,
    operator: String(formData.get("operator") || "").trim() || null,
    service_name: String(formData.get("service_name") || "").trim() || null,
    origin,
    destination,
    departure_time: String(formData.get("departure_time") || "").trim() || null,
    arrival_time: String(formData.get("arrival_time") || "").trim() || null,
    reservation_required: formData.get("reservation_required") === "on",
    booking_reference: String(formData.get("booking_reference") || "").trim() || null,
    seat: String(formData.get("seat") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    distance_km: Number(formData.get("distance_km") || 0) || null,
    toll_jpy: Number(formData.get("toll_jpy") || 0) || null,
    fuel_jpy: Number(formData.get("fuel_jpy") || 0) || null,
    parking_jpy: Number(formData.get("parking_jpy") || 0) || null,
    rest_stop: String(formData.get("rest_stop") || "").trim() || null,
    winter_ready: formData.get("winter_ready") === "on",
  }).eq("id", segmentId).eq("trip_id", tripId);
  if (error) throw new Error(`แก้ไขการเดินทางไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function deleteTransportSegment(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const segmentId = String(formData.get("segment_id") || "");
  if (!tripId || !segmentId) return;
  const { error } = await supabase.from("transport_segments").delete().eq("id", segmentId).eq("trip_id", tripId);
  if (error) throw new Error(`ลบการเดินทางไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}
