"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function storagePath(details: unknown) {
  if (!details || typeof details !== "object") return "";
  const value = (details as Record<string, unknown>).storage_path;
  return typeof value === "string" ? value : "";
}

export async function deleteTripDocument(formData: FormData) {
  const tripId = String(formData.get("trip_id") || "");
  const documentId = String(formData.get("document_id") || "");
  if (!tripId || !documentId) return;

  const { supabase } = await requireVerifiedUser(`/trips/${tripId}/documents`);
  const { data: row, error: readError } = await supabase
    .from("bookings")
    .select("id,details")
    .eq("id", documentId)
    .eq("trip_id", tripId)
    .eq("booking_type", "document")
    .single();

  if (readError || !row) throw new Error(`ไม่พบเอกสารที่ต้องการลบ: ${readError?.message || "not found"}`);

  const path = storagePath(row.details);
  if (path) {
    const { error: storageError } = await supabase.storage.from("trip-documents").remove([path]);
    if (storageError) throw new Error(`ลบไฟล์ไม่สำเร็จ: ${storageError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("id", documentId)
    .eq("trip_id", tripId)
    .eq("booking_type", "document");
  if (deleteError) throw new Error(`ลบเอกสารไม่สำเร็จ: ${deleteError.message}`);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/documents`);
  revalidatePath(`/trips/${tripId}/bookings`);
  revalidatePath(`/trips/${tripId}/master-plan`);
}
