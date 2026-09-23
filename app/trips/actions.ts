"use server";

import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export async function removeDuplicateTrips() {
  const { supabase } = await requireVerifiedUser("/trips");

  const { data, error } = await supabase.rpc("remove_my_duplicate_trips");
  if (error) {
    redirect(`/trips?dedupe_error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/trips?deduped=${Number(data || 0)}`);
}
