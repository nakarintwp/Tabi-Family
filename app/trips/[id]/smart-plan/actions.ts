"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DISCOVERY_PLACES, getPlaceGuide, googleMapsSearchUrl } from "@/lib/discovery";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function distanceKm(a: { latitude?: number; longitude?: number }, b: { latitude?: number; longitude?: number }) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Number.POSITIVE_INFINITY;
  const toRad = (v: number) => v * Math.PI / 180;
  const earth = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function nearestNeighbor<T extends { latitude?: number; longitude?: number; title: string }>(items: T[]) {
  if (items.length <= 1) return items;
  const remaining = [...items];
  const ordered: T[] = [remaining.shift() as T];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const d = distanceKm(last, candidate);
      if (d < bestDistance || (d === bestDistance && candidate.title.localeCompare(remaining[bestIndex].title) < 0)) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }
  return ordered;
}

function smartOrder(slugs: string[]) {
  const selected = slugs
    .map((slug) => DISCOVERY_PLACES.find((place) => place.slug === slug))
    .filter((place): place is (typeof DISCOVERY_PLACES)[number] => Boolean(place));
  const visits = selected.filter((place) => place.category !== "food" && place.category !== "shopping");
  const meals = selected.filter((place) => place.category === "food");
  const shopping = selected.filter((place) => place.category === "shopping");
  const ordered = nearestNeighbor(visits);
  if (meals.length) ordered.splice(Math.min(2, ordered.length), 0, meals[0]);
  if (meals.length > 1) ordered.push(...meals.slice(1));
  ordered.push(...shopping);
  const included = new Set(ordered.map((place) => place.slug));
  ordered.push(...selected.filter((place) => !included.has(place.slug)));
  return ordered;
}


export async function createSmartDayPlan(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const dayId = String(formData.get("day_id") || "");
  const slugs = formData.getAll("place_slugs").map(String).filter(Boolean).slice(0, 8);
  if (!tripId || !dayId || !slugs.length) return;

  const { data: day } = await supabase.from("trip_days").select("id").eq("id", dayId).eq("trip_id", tripId).maybeSingle();
  if (!day) return;

  const { data: existing } = await supabase.from("activities").select("title,sort_order").eq("day_id", dayId).order("sort_order", { ascending: false });
  const existingTitles = new Set((existing || []).map((row: { title: string }) => String(row.title).toLowerCase()));
  const startOrder = Number(existing?.[0]?.sort_order ?? -1) + 1;
  const timeSlots = ["09:00", "10:45", "12:30", "14:30", "16:30", "18:30", "20:00", "21:00"];
  const ordered = smartOrder(slugs).filter((place) => !existingTitles.has(place.title.toLowerCase()));

  const rows = ordered.map((place, index) => {
    const guide = getPlaceGuide(place.slug);
    const notes = [
      "Smart Day Planner V7.7",
      place.summary,
      guide.bestTime ? `ช่วงแนะนำ: ${guide.bestTime}` : "",
      guide.reservationNote ? `จอง: ${guide.reservationNote}` : "",
      "เวลาเป็นจุดเริ่มต้น ควรตรวจเวลาเปิดและเวลาเดินทางจริงก่อนออกเดินทาง",
    ].filter(Boolean).join(" · ");
    return {
      day_id: dayId,
      title: place.title,
      activity_type: ["food", "shopping"].includes(place.category) ? place.category : "attraction",
      start_time: timeSlots[index] || null,
      duration_minutes: place.durationMinutes,
      location_name: `${place.title}, ${place.city}`,
      maps_url: googleMapsSearchUrl(place.title, place.city),
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      notes,
      child_friendly: place.childFriendly,
      senior_friendly: place.seniorFriendly,
      is_outdoor: place.isOutdoor,
      status: "planned",
      sort_order: startOrder + index,
    };
  });

  if (rows.length) {
    const { error } = await supabase.from("activities").insert(rows);
    if (error) throw new Error(`สร้าง Smart Day ไม่สำเร็จ: ${error.message}`);
  }

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/days/${dayId}`);
  revalidatePath(`/trips/${tripId}/calendar`);
  revalidatePath(`/trips/${tripId}/map`);
  revalidatePath("/plan");
  redirect(`/trips/${tripId}/days/${dayId}?smart=1`);
}
