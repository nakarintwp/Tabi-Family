"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function changePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");
  if (password.length < 8) redirect("/account?password_error=short");
  if (password !== confirm) redirect("/account?password_error=mismatch");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/auth/login?next=/account");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/account?password_error=${encodeURIComponent(error.message)}`);
  revalidatePath("/account");
  redirect("/account?password_changed=1");
}
