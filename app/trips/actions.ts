"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function removeDuplicateTrips() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login?next=/trips");

  const { data, error } = await supabase.rpc("remove_my_duplicate_trips");
  if (error) {
    redirect(`/trips?dedupe_error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/trips?deduped=${Number(data || 0)}`);
}
