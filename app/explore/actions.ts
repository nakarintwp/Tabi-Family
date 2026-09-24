"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { getPlace, getPlaceGuide, googleMapsSearchUrl } from "@/lib/discovery";

function redirectWith(returnTo: string, key: string, value: string) {
  const joiner = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${joiner}${key}=${encodeURIComponent(value)}`);
}

async function upsertPlaceToWishlist(supabase: any, userId: string, tripId: string, place: NonNullable<ReturnType<typeof getPlace>>) {
  return supabase.from("trip_wishlist").upsert({
    trip_id: tripId,
    place_key: place.slug,
    title: place.title,
    city: place.city,
    category: place.category,
    emoji: place.emoji,
    summary: place.summary,
    maps_url: googleMapsSearchUrl(place.title, place.city),
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    child_friendly: place.childFriendly,
    senior_friendly: place.seniorFriendly,
    is_outdoor: place.isOutdoor,
    duration_minutes: place.durationMinutes,
    notes: getPlaceGuide(place.slug).bestTime ? `แนะนำช่วง: ${getPlaceGuide(place.slug).bestTime}` : null,
    created_by: userId,
  }, { onConflict: "trip_id,place_key" });
}

async function insertPlaceToDay(supabase: any, tripId: string, dayId: string, place: NonNullable<ReturnType<typeof getPlace>>) {
  const { data: day } = await supabase.from("trip_days").select("id").eq("id", dayId).eq("trip_id", tripId).maybeSingle();
  if (!day) return { error: { message: "Day นี้ไม่อยู่ในทริปที่เลือก" } };

  const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("day_id", dayId);
  const guide = getPlaceGuide(place.slug);
  const activityType = ["food", "shopping"].includes(place.category) ? place.category : "attraction";
  const notes = [place.summary, guide.bestTime ? `แนะนำช่วง: ${guide.bestTime}` : "", guide.reservationNote ? `จอง: ${guide.reservationNote}` : ""].filter(Boolean).join(" · ");
  return supabase.from("activities").insert({
    day_id: dayId,
    title: place.title,
    activity_type: activityType,
    location_name: `${place.title}, ${place.city}`,
    maps_url: googleMapsSearchUrl(place.title, place.city),
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    duration_minutes: place.durationMinutes,
    child_friendly: place.childFriendly,
    senior_friendly: place.seniorFriendly,
    is_outdoor: place.isOutdoor,
    notes: notes || null,
    status: "planned",
    sort_order: count || 0,
  });
}

export async function savePlaceToWishlist(formData: FormData) {
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const tripId = String(formData.get("trip_id") || "");
  const placeSlug = String(formData.get("place_slug") || "");
  const returnTo = String(formData.get("return_to") || "/explore");
  const place = getPlace(placeSlug);
  if (!tripId || !place) return redirectWith(returnTo, "error", "ข้อมูลสถานที่ไม่ถูกต้อง");

  const { error } = await upsertPlaceToWishlist(supabase, userId, tripId, place);
  if (error) return redirectWith(returnTo, "error", error.message);
  revalidatePath(`/trips/${tripId}/wishlist`);
  revalidatePath(`/trips/${tripId}`);
  return redirectWith(returnTo, "saved", "1");
}

export async function addPlaceToTrip(formData: FormData) {
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const placeSlug = String(formData.get("place_slug") || "");
  const returnTo = String(formData.get("return_to") || "/explore");
  const place = getPlace(placeSlug);
  if (!tripId || !place) return redirectWith(returnTo, "error", "ข้อมูลสถานที่ไม่ถูกต้อง");

  if (dayId) {
    const { error } = await insertPlaceToDay(supabase, tripId, dayId, place);
    if (error) return redirectWith(returnTo, "error", error.message);
    revalidatePath(`/trips/${tripId}/days/${dayId}`);
    revalidatePath(`/trips/${tripId}/calendar`);
    revalidatePath("/plan");
  } else {
    const { error } = await upsertPlaceToWishlist(supabase, userId, tripId, place);
    if (error) return redirectWith(returnTo, "error", error.message);
    revalidatePath(`/trips/${tripId}/wishlist`);
  }

  revalidatePath(`/trips/${tripId}`);
  return redirectWith(returnTo, "added", "1");
}

export async function addPlaceToDay(formData: FormData) {
  return addPlaceToTrip(formData);
}
