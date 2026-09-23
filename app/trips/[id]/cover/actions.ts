"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { COVER_STYLES } from "@/lib/discovery";

export async function updateTripCover(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const styleRaw = String(formData.get("cover_style") || "sky");
  const style = COVER_STYLES.some((item) => item.id === styleRaw) ? styleRaw : "sky";
  const emoji = String(formData.get("cover_emoji") || "🧳").trim().slice(0, 12) || "🧳";
  const tagline = String(formData.get("cover_tagline") || "").trim().slice(0, 120) || null;
  if (!tripId) return;
  const { error } = await supabase.from("trips").update({ cover_style: style, cover_emoji: emoji, cover_tagline: tagline }).eq("id", tripId);
  if (error) throw new Error(`บันทึก Cover ไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/cover`);
  revalidatePath("/trips");
}
