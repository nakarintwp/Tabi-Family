"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fail(message: string): never {
  redirect(`/trips/new?error=${encodeURIComponent(message)}`);
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
  while (cursor <= end && dates.length < 31) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function createTrip(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    fail("ยังไม่ได้ตั้งค่า Supabase environment variables");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login?next=/trips/new");

  const title = String(formData.get("title") || "Japan Family Trip").trim();
  const startDate = toIsoDate(formData.get("start_date"));
  const endDate = toIsoDate(formData.get("end_date"));
  const cities = String(formData.get("cities") || "Tokyo")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
  const pace = String(formData.get("pace") || "balanced");
  const budgetRaw = Number(formData.get("budget") || 0);
  const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : null;
  const adults = Math.min(10, Math.max(0, Number(formData.get("adults") || 0)));
  const children = Math.min(10, Math.max(0, Number(formData.get("children") || 0)));
  const seniors = Math.min(10, Math.max(0, Number(formData.get("seniors") || 0)));

  if (!title) fail("กรุณาใส่ชื่อทริป");
  if (!startDate || !endDate) fail("กรุณาเลือกวันเริ่มและวันกลับ");

  const tripDates = enumerateDates(startDate, endDate);
  if (!tripDates.length) fail("วันกลับต้องไม่น้อยกว่าวันเริ่ม");
  if (tripDates.length >= 31) fail("MVP รองรับทริปไม่เกิน 30 วันต่อครั้ง");
  if (!cities.length) fail("กรุณาระบุอย่างน้อย 1 เมือง");
  if (!["relaxed", "balanced", "packed"].includes(pace)) fail("รูปแบบทริปไม่ถูกต้อง");

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      owner_id: userId,
      title,
      start_date: startDate,
      end_date: endDate,
      cities,
      pace,
      budget,
      currency: "THB",
    })
    .select("id")
    .single();

  if (tripError || !trip) fail(tripError?.message || "สร้างทริปไม่สำเร็จ");

  const cleanupAndFail = async (message: string): Promise<never> => {
    await supabase.from("trips").delete().eq("id", trip.id);
    fail(message);
  };

  const memberRows: Array<{ trip_id: string; name: string; member_type: string; walking_level: number; needs: string[] }> = [];
  for (let i = 0; i < adults; i++) {
    memberRows.push({ trip_id: trip.id, name: `Adult ${i + 1}`, member_type: "adult", walking_level: 3, needs: [] });
  }
  for (let i = 0; i < children; i++) {
    memberRows.push({ trip_id: trip.id, name: `Child ${i + 1}`, member_type: "child", walking_level: 2, needs: ["พักเป็นระยะ"] });
  }
  for (let i = 0; i < seniors; i++) {
    memberRows.push({ trip_id: trip.id, name: `Senior ${i + 1}`, member_type: "senior", walking_level: 2, needs: ["หลีกเลี่ยงบันได", "พักเป็นระยะ"] });
  }

  if (memberRows.length) {
    const { error } = await supabase.from("trip_members").insert(memberRows);
    if (error) await cleanupAndFail(`สร้างสมาชิกไม่สำเร็จ: ${error.message}`);
  }

  const { error: dayError } = await supabase.from("trip_days").insert(
    tripDates.map((tripDate, index) => ({
      trip_id: trip.id,
      trip_date: tripDate,
      title: `Day ${index + 1}`,
    })),
  );
  if (dayError) await cleanupAndFail(`สร้างวันเดินทางไม่สำเร็จ: ${dayError.message}`);

  redirect(`/trips/${trip.id}`);
}
