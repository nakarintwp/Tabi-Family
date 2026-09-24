"use server";

import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_DESTINATIONS, getPlace, getTemplate, googleMapsSearchUrl } from "@/lib/discovery";

function fail(message: string): never {
  return redirect(`/trips/new?error=${encodeURIComponent(message)}`);
}

function toIsoDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function enumerateDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length <= 30) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function createTrip(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) fail("ยังไม่ได้ตั้งค่า Supabase environment variables");
  const { supabase } = await requireVerifiedUser("/trips/new");

  const title = String(formData.get("title") || "Japan Family Trip").trim();
  const startDate = toIsoDate(formData.get("start_date"));
  const endDate = toIsoDate(formData.get("end_date"));
  const allowedCities = new Set<string>(DISCOVERY_DESTINATIONS.map((item) => String(item.id)));
  const cityValues = formData.getAll("cities").map((value) => String(value).trim()).filter((value) => allowedCities.has(value));
  const legacyCities = String(formData.get("cities_text") || "").split(",").map((value) => value.trim()).filter((value) => allowedCities.has(value));
  const cities = Array.from(new Set(cityValues.length ? cityValues : legacyCities)).slice(0, 30);
  const pace = String(formData.get("pace") || "balanced");
  const budgetRaw = Number(formData.get("budget") || 0);
  const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : null;
  const adults = Math.min(10, Math.max(0, Number(formData.get("adults") || 0)));
  const children = Math.min(10, Math.max(0, Number(formData.get("children") || 0)));
  const seniors = Math.min(10, Math.max(0, Number(formData.get("seniors") || 0)));
  const templateId = String(formData.get("template_id") || "").trim();
  const template = templateId ? getTemplate(templateId) : undefined;

  if (!title) fail("กรุณาใส่ชื่อทริป");
  if (!startDate || !endDate) fail("กรุณาเลือกวันเริ่มและวันกลับ");
  const tripDates = enumerateDates(startDate, endDate);
  if (!tripDates.length) fail("วันกลับต้องไม่น้อยกว่าวันเริ่ม");
  if (tripDates.length > 30) fail("รองรับทริปไม่เกิน 30 วันต่อครั้ง");
  if (!cities.length) fail("กรุณาระบุอย่างน้อย 1 เมือง");
  if (!["relaxed", "balanced", "packed"].includes(pace)) fail("รูปแบบทริปไม่ถูกต้อง");

  const requestId = String(formData.get("create_request_id") || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) fail("รหัสคำขอสร้างทริปไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่");

  const { data: tripId, error: createError } = await supabase.rpc("create_trip_bundle_once", {
    p_request_id: requestId,
    p_title: title,
    p_start_date: startDate,
    p_end_date: endDate,
    p_cities: cities,
    p_pace: pace,
    p_budget: budget,
    p_adults: adults,
    p_children: children,
    p_seniors: seniors,
  });
  if (createError || !tripId) fail(createError?.message || "สร้างทริปไม่สำเร็จ");

  if (template) {
    const { data: tripMeta } = await supabase.from("trips").select("template_key").eq("id", tripId).single();
    if (!tripMeta?.template_key) {
      const { data: days } = await supabase.from("trip_days").select("id,trip_date").eq("trip_id", tripId).order("trip_date");
      const dayRows = days || [];
      const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).in("day_id", dayRows.map((d: { id: string }) => d.id));
      if ((count || 0) === 0) {
        const payload = template.activities.flatMap((activity, index) => {
          const day = dayRows[activity.day - 1];
          if (!day) return [];
          const place = activity.placeSlug ? getPlace(activity.placeSlug) : undefined;
          return [{
            day_id: day.id,
            title: activity.title,
            activity_type: activity.type,
            start_time: activity.startTime || null,
            location_name: place ? `${place.title}, ${place.city}` : null,
            latitude: place?.latitude ?? null,
            longitude: place?.longitude ?? null,
            maps_url: place ? googleMapsSearchUrl(place.title, place.city) : null,
            duration_minutes: place?.durationMinutes ?? null,
            child_friendly: place?.childFriendly ?? true,
            senior_friendly: place?.seniorFriendly ?? true,
            is_outdoor: place?.isOutdoor ?? false,
            notes: activity.notes || null,
            sort_order: index,
          }];
        });
        if (payload.length) await supabase.from("activities").insert(payload);
      }
      await supabase.from("trips").update({ template_key: template.id, cover_style: template.coverStyle, cover_emoji: template.coverEmoji, cover_tagline: template.subtitle }).eq("id", tripId);
    }
  }

  redirect(`/trips/${tripId}`);
}
