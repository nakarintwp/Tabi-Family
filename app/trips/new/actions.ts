"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTrip(formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/?demo=1");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const title = String(formData.get("title") || "Japan Family Trip");
  const startDate = String(formData.get("start_date") || "");
  const endDate = String(formData.get("end_date") || "");
  const cities = String(formData.get("cities") || "Tokyo").split(",").map(v => v.trim()).filter(Boolean);
  const pace = String(formData.get("pace") || "balanced");

  const { error } = await supabase.from("trips").insert({
    owner_id: userId,
    title,
    start_date: startDate || null,
    end_date: endDate || null,
    cities,
    pace,
    currency: "THB",
  });
  if (error) throw new Error(error.message);
  redirect("/");
}
