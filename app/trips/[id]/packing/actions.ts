"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/auth/login");
  return supabase;
}

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/packing`);
}

export async function addPackingItem(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const label = String(formData.get("label") || "").trim();
  if (!tripId || !label) return;

  const quantity = Math.min(99, Math.max(1, Number(formData.get("quantity") || 1)));
  const { data: last } = await supabase.from("packing_items").select("sort_order").eq("trip_id", tripId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("packing_items").insert({
    trip_id: tripId,
    label,
    category: String(formData.get("category") || "other"),
    assigned_to: String(formData.get("assigned_to") || "").trim() || null,
    quantity,
    notes: String(formData.get("notes") || "").trim() || null,
    sort_order: Number(last?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(`เพิ่ม Packing item ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function togglePackingItem(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const itemId = String(formData.get("item_id") || "");
  const isPacked = String(formData.get("is_packed") || "false") === "true";
  if (!tripId || !itemId) return;
  const { error } = await supabase.from("packing_items").update({ is_packed: !isPacked }).eq("id", itemId).eq("trip_id", tripId);
  if (error) throw new Error(`อัปเดต checklist ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function deletePackingItem(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const itemId = String(formData.get("item_id") || "");
  if (!tripId || !itemId) return;
  const { error } = await supabase.from("packing_items").delete().eq("id", itemId).eq("trip_id", tripId);
  if (error) throw new Error(`ลบ Packing item ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function seedPackingList(formData: FormData) {
  const supabase = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  if (!tripId) return;
  const { error } = await supabase.rpc("seed_packing_list", { p_trip_id: tripId });
  if (error) throw new Error(`สร้างรายการเริ่มต้นไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}
