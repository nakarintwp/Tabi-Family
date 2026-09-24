"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_DESTINATIONS } from "@/lib/discovery";

export async function updateTripDestinations(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const { supabase, userId } = await requireVerifiedUser(`/trips/${tripId}/destinations`);
  const allowed = new Set<string>(DISCOVERY_DESTINATIONS.map((item) => String(item.id)));
  const cities = Array.from(new Set(formData.getAll("cities").map((value) => String(value)).filter((value) => allowed.has(value))));
  if (!tripId || !cities.length) redirect(`/trips/${tripId}/destinations?error=${encodeURIComponent("กรุณาเลือกอย่างน้อย 1 เมือง")}`);

  const { error } = await supabase.from("trips").update({ cities }).eq("id", tripId).eq("owner_id", userId);
  if (error) redirect(`/trips/${tripId}/destinations?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/destinations`);
  revalidatePath("/explore");
  redirect(`/trips/${tripId}/destinations?saved=1`);
}
