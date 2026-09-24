"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { getPlace, googleMapsSearchUrl } from "@/lib/discovery";

export async function savePlaceToWishlist(formData: FormData) {
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const tripId = String(formData.get("trip_id") || "");
  const placeSlug = String(formData.get("place_slug") || "");
  const returnTo = String(formData.get("return_to") || "/explore");
  const place = getPlace(placeSlug);
  if (!tripId || !place) {
    const joiner = returnTo.includes("?") ? "&" : "?";
    return redirect(`${returnTo}${joiner}error=${encodeURIComponent("ข้อมูลสถานที่ไม่ถูกต้อง")}`);
  }

  const { error } = await supabase.from("trip_wishlist").upsert({
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
    created_by: userId,
  }, { onConflict: "trip_id,place_key" });

  if (error) {
    const joiner = returnTo.includes("?") ? "&" : "?";
    return redirect(`${returnTo}${joiner}error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/trips/${tripId}/wishlist`);
  revalidatePath(`/trips/${tripId}`);
  const joiner = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${joiner}saved=1&trip=${encodeURIComponent(tripId)}`);
}
