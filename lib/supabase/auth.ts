import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function loginUrl(nextPath: string, stale = false) {
  const safeNext = nextPath.startsWith("/") ? nextPath : "/trips";
  const params = new URLSearchParams({ next: safeNext });
  if (stale) params.set("session", "expired");
  return `/auth/login?${params.toString()}`;
}

/**
 * Server-side authorization helper.
 *
 * getUser() validates the access token against Supabase Auth instead of only
 * trusting JWT claims cached in the browser. This matters when a user is
 * deleted, disabled, or the browser is holding an old session.
 */
export async function requireVerifiedUser(nextPath = "/trips") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(loginUrl(nextPath, true));
  }

  return {
    supabase,
    user: data.user,
    userId: data.user.id,
  };
}

/** Returns a verified user when one exists, otherwise null without redirecting. */
export async function getOptionalVerifiedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}
