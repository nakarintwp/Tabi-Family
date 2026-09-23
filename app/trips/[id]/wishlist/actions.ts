"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/wishlist`);
  revalidatePath("/explore");
}

export async function removeWishlistItem(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const wishlistId = String(formData.get("wishlist_id") || "");
  if (!tripId || !wishlistId) return;
  const { error } = await supabase.from("trip_wishlist").delete().eq("id", wishlistId).eq("trip_id", tripId);
  if (error) throw new Error(`ลบ Wishlist ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function addWishlistToDay(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const wishlistId = String(formData.get("wishlist_id") || "");
  const dayId = String(formData.get("day_id") || "");
  if (!tripId || !wishlistId || !dayId) return;

  const [{ data: item, error: itemError }, { data: day, error: dayError }] = await Promise.all([
    supabase.from("trip_wishlist").select("*").eq("id", wishlistId).eq("trip_id", tripId).single(),
    supabase.from("trip_days").select("id,trip_id").eq("id", dayId).eq("trip_id", tripId).single(),
  ]);
  if (itemError || !item) throw new Error(`อ่าน Wishlist ไม่สำเร็จ: ${itemError?.message || "not found"}`);
  if (dayError || !day) throw new Error(`วันเดินทางไม่ถูกต้อง: ${dayError?.message || "not found"}`);

  const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("day_id", dayId);
  const activityType = ["food", "shopping"].includes(item.category) ? item.category : "attraction";
  const { error } = await supabase.from("activities").insert({
    day_id: dayId,
    title: item.title,
    activity_type: activityType,
    location_name: item.city ? `${item.title}, ${item.city}` : item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    maps_url: item.maps_url,
    duration_minutes: item.duration_minutes,
    child_friendly: item.child_friendly,
    senior_friendly: item.senior_friendly,
    is_outdoor: item.is_outdoor,
    notes: item.notes || item.summary || null,
    sort_order: count || 0,
  });
  if (error) throw new Error(`เพิ่มลง Day Planner ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
}
