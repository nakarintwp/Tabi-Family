"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";

async function requireOwner(tripId: string) {
  const { supabase, userId } = await requireVerifiedUser(`/trips/${tripId}/share`);
  const { data: role } = await supabase.rpc("trip_access_role", { p_trip_id: tripId });
  if (role !== "owner") throw new Error("เฉพาะเจ้าของทริปเท่านั้นที่จัดการการแชร์ได้");
  return { supabase, userId };
}

export async function createInvite(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  if (!tripId) return;
  const { supabase, userId } = await requireOwner(tripId);
  const role = String(formData.get("role") || "viewer") === "editor" ? "editor" : "viewer";
  const hours = Math.min(24 * 30, Math.max(1, Number(formData.get("expires_hours") || 168)));
  const maxUses = Math.min(100, Math.max(1, Number(formData.get("max_uses") || 5)));
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("trip_invites").insert({
    trip_id: tripId,
    role,
    expires_at: expiresAt,
    max_uses: maxUses,
    created_by: userId,
  });
  if (error) throw new Error(`สร้าง QR Invite ไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}/share`);
}

export async function revokeInvite(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const inviteId = String(formData.get("invite_id") || "");
  if (!tripId || !inviteId) return;
  const { supabase } = await requireOwner(tripId);
  const { error } = await supabase
    .from("trip_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("trip_id", tripId);
  if (error) throw new Error(`ยกเลิกคำเชิญไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}/share`);
}

export async function changeCollaboratorRole(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "viewer") === "editor" ? "editor" : "viewer";
  if (!tripId || !userId) return;
  const { supabase } = await requireOwner(tripId);
  const { error } = await supabase
    .from("trip_collaborators")
    .update({ role })
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  if (error) throw new Error(`เปลี่ยนสิทธิ์ไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}/share`);
}

export async function removeCollaborator(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const userId = String(formData.get("user_id") || "");
  if (!tripId || !userId) return;
  const { supabase } = await requireOwner(tripId);
  const { error } = await supabase
    .from("trip_collaborators")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  if (error) throw new Error(`นำสมาชิกออกไม่สำเร็จ: ${error.message}`);
  revalidatePath(`/trips/${tripId}/share`);
  revalidatePath(`/trips/${tripId}`);
}
