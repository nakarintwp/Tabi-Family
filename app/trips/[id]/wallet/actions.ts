"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");
  return { supabase, userId };
}

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/wallet`);
  revalidatePath("/wallet");
}

export async function addBooking(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!tripId || !title) return;
  const { error } = await supabase.from("bookings").insert({
    trip_id: tripId,
    booking_type: String(formData.get("booking_type") || "other"),
    title,
    provider: String(formData.get("provider") || "").trim() || null,
    reference_code: String(formData.get("reference_code") || "").trim() || null,
    start_at: String(formData.get("start_at") || "").trim() || null,
    end_at: String(formData.get("end_at") || "").trim() || null,
    confirmation_url: String(formData.get("confirmation_url") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  if (error) throw new Error(`เพิ่ม Booking ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function deleteBooking(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const bookingId = String(formData.get("booking_id") || "");
  if (!tripId || !bookingId) return;
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId).eq("trip_id", tripId);
  if (error) throw new Error(`ลบ Booking ไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function addExpense(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const amount = Number(formData.get("amount") || 0);
  if (!tripId || !Number.isFinite(amount) || amount <= 0) return;
  const paidDate = String(formData.get("paid_date") || "").trim();
  const { error } = await supabase.from("expenses").insert({
    trip_id: tripId,
    amount,
    currency: String(formData.get("currency") || "JPY"),
    category: String(formData.get("category") || "other"),
    note: String(formData.get("note") || "").trim() || null,
    paid_at: paidDate ? `${paidDate}T12:00:00+09:00` : new Date().toISOString(),
    created_by: userId,
  });
  if (error) throw new Error(`เพิ่มค่าใช้จ่ายไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const expenseId = String(formData.get("expense_id") || "");
  if (!tripId || !expenseId) return;
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId).eq("trip_id", tripId);
  if (error) throw new Error(`ลบค่าใช้จ่ายไม่สำเร็จ: ${error.message}`);
  refresh(tripId);
}
