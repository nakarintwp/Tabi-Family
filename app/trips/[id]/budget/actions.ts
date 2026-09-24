"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export async function updateTripBudget(formData: FormData) {
  const { supabase } = await requireVerifiedUser("/trips");
  const tripId = String(formData.get("trip_id") || "");
  const budget = Number(formData.get("budget") || 0);
  const currency = String(formData.get("currency") || "THB");
  if (!tripId || !Number.isFinite(budget) || budget < 0) return;
  const { error } = await supabase.from("trips").update({ budget, currency }).eq("id", tripId);
  if (error) throw new Error(`อัปเดตงบไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/budget`);
  revalidatePath(`/trips/${tripId}/wallet`);
}
