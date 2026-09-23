"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") || "");
  if (!token) redirect("/trips");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/join/${encodeURIComponent(token)}`);

  const { data: tripId, error } = await supabase.rpc("accept_trip_invite", { p_token: token });
  if (error || !tripId) {
    const message = encodeURIComponent(error?.message || "Invite ใช้งานไม่ได้");
    redirect(`/join/${encodeURIComponent(token)}?error=${message}`);
  }
  redirect(`/trips/${tripId}?joined=1`);
}
