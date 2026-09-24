"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/supabase/auth";

async function requireUser() {
  return requireVerifiedUser("/trips");
}

function refresh(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/wallet`);
  revalidatePath(`/trips/${tripId}/bookings`);
  revalidatePath(`/trips/${tripId}/budget`);
  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath(`/trips/${tripId}/master-plan`);
  revalidatePath("/today");
  revalidatePath("/wallet");
}

export async function addBooking(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!tripId || !title) return;
  const details = {
    status: String(formData.get("status") || "planned"),
    payment_status: String(formData.get("payment_status") || "unknown"),
    amount: String(formData.get("amount") || "").trim(),
    currency: String(formData.get("booking_currency") || "JPY"),
    party_size: String(formData.get("party_size") || "").trim(),
    contact: String(formData.get("contact") || "").trim(),
    doc_category: String(formData.get("doc_category") || "").trim(),
  };
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
    details,
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
    paid_by: String(formData.get("paid_by") || "").trim() || null,
    payment_method: String(formData.get("payment_method") || "").trim() || null,
    exchange_rate_thb: Number(formData.get("exchange_rate_thb") || 0) > 0 ? Number(formData.get("exchange_rate_thb")) : null,
    planned_amount: Number(formData.get("planned_amount") || 0) > 0 ? Number(formData.get("planned_amount")) : null,
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
