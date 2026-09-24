"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { bookingTypeToMode, documentCategoryForBooking, type ImportedBookingDraft } from "@/lib/v10";

const bookingTypes = new Set(["flight", "hotel", "train", "bus", "rental_car", "restaurant", "ticket", "other"]);

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function safeDetails(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

async function autoFindDocument(supabase: any, tripId: string, bookingType: ImportedBookingDraft["bookingType"], referenceCode: string, provider: string) {
  const category = documentCategoryForBooking(bookingType);
  const { data } = await supabase
    .from("bookings")
    .select("id,title,provider,reference_code,details,created_at")
    .eq("trip_id", tripId)
    .eq("booking_type", "document")
    .order("created_at", { ascending: false })
    .limit(20);
  const docs = data || [];
  let best: { id: string; score: number } | null = null;
  let categoryCandidates = 0;
  let soleCategoryId = "";
  for (const doc of docs) {
    const details = safeDetails(doc.details);
    if (details.linked_booking_id) continue;
    let score = 0;
    if (String(details.doc_category || "") === category) { score += 4; categoryCandidates += 1; soleCategoryId = doc.id; }
    if (referenceCode && String(doc.reference_code || "").toLowerCase() === referenceCode.toLowerCase()) score += 8;
    if (provider && `${doc.provider || ""} ${doc.title || ""}`.toLowerCase().includes(provider.toLowerCase())) score += 3;
    if (!best || score > best.score) best = { id: doc.id, score };
  }
  if (best && best.score >= 7) return best.id;
  if (!referenceCode && !provider && categoryCandidates === 1) return soleCategoryId;
  return "";
}

async function linkDocument(supabase: any, tripId: string, documentId: string, bookingId: string, bookingType: string, confidence: number) {
  if (!documentId) return;
  const { data: document } = await supabase
    .from("bookings")
    .select("id,details")
    .eq("id", documentId)
    .eq("trip_id", tripId)
    .eq("booking_type", "document")
    .maybeSingle();
  if (!document) return;
  const details = safeDetails(document.details);
  const { error } = await supabase.from("bookings").update({
    details: {
      ...details,
      linked_booking_id: bookingId,
      linked_booking_type: bookingType,
      auto_linked_at: new Date().toISOString(),
      auto_link_confidence: confidence,
    },
  }).eq("id", documentId).eq("trip_id", tripId);
  if (error) throw new Error(`ผูกเอกสารไม่สำเร็จ: ${error.message}`);
}

export async function createImportedBooking(formData: FormData) {
  const tripId = text(formData.get("trip_id"));
  if (!tripId) throw new Error("ไม่พบ Trip ID");
  const { supabase, userId } = await requireVerifiedUser(`/trips/${tripId}/import-booking`);
  const bookingTypeRaw = text(formData.get("booking_type"));
  const bookingType = (bookingTypes.has(bookingTypeRaw) ? bookingTypeRaw : "other") as ImportedBookingDraft["bookingType"];
  const title = text(formData.get("title"));
  if (!title) throw new Error("กรุณาตรวจชื่อ Booking ก่อนบันทึก");

  const provider = text(formData.get("provider"));
  const referenceCode = text(formData.get("reference_code"));
  const startAt = text(formData.get("start_at"));
  const endAt = text(formData.get("end_at"));
  const amount = text(formData.get("amount"));
  const currency = text(formData.get("currency")) || "JPY";
  const confidence = Math.max(0, Math.min(100, Number(formData.get("confidence") || 0)));
  const sourceFileName = text(formData.get("source_file_name"));
  const sourceExcerpt = text(formData.get("source_excerpt")).slice(0, 2500);
  const requestedDocumentId = text(formData.get("document_id"));
  const requestedTransportId = text(formData.get("transport_id"));
  const origin = text(formData.get("origin"));
  const destination = text(formData.get("destination"));
  const createTransport = formData.get("create_transport") === "on";

  let documentId = requestedDocumentId;
  if (!documentId) documentId = await autoFindDocument(supabase, tripId, bookingType, referenceCode, provider);

  const details: Record<string, unknown> = {
    status: text(formData.get("status")) || "confirmed",
    payment_status: text(formData.get("payment_status")) || "unknown",
    amount,
    currency,
    import_source: sourceFileName ? "local_file" : "pasted_text",
    imported_by: userId,
    imported_at: new Date().toISOString(),
    import_confidence: confidence,
    source_file_name: sourceFileName || null,
    source_excerpt: sourceExcerpt || null,
    linked_document_id: documentId || null,
    linked_transport_id: requestedTransportId || null,
    auto_import_v10: true,
  };

  const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
    trip_id: tripId,
    booking_type: bookingType,
    title,
    provider: provider || null,
    reference_code: referenceCode || null,
    start_at: startAt || null,
    end_at: endAt || null,
    confirmation_url: text(formData.get("confirmation_url")) || null,
    notes: text(formData.get("notes")) || null,
    details,
  }).select("id").single();
  if (bookingError || !booking) throw new Error(`สร้าง Booking ไม่สำเร็จ: ${bookingError?.message || "unknown error"}`);

  if (documentId) await linkDocument(supabase, tripId, documentId, booking.id, bookingType, confidence);

  if (requestedTransportId && referenceCode) {
    const { data: segment } = await supabase.from("transport_segments").select("id,booking_reference").eq("id", requestedTransportId).eq("trip_id", tripId).maybeSingle();
    if (segment && !segment.booking_reference) await supabase.from("transport_segments").update({ booking_reference: referenceCode }).eq("id", requestedTransportId).eq("trip_id", tripId);
  }

  let createdTransportId = "";
  const mode = bookingTypeToMode(bookingType);
  if (createTransport && !requestedTransportId && mode && origin && destination) {
    let dayId: string | null = null;
    if (startAt) {
      const { data: day } = await supabase.from("trip_days").select("id").eq("trip_id", tripId).eq("trip_date", startAt.slice(0, 10)).maybeSingle();
      dayId = day?.id || null;
    }
    const { count } = await supabase.from("transport_segments").select("id", { count: "exact", head: true }).eq("trip_id", tripId);
    const { data: segment, error: segmentError } = await supabase.from("transport_segments").insert({
      trip_id: tripId,
      day_id: dayId,
      mode,
      operator: provider || null,
      service_name: title,
      origin,
      destination,
      departure_time: startAt ? startAt.slice(11, 16) || null : null,
      arrival_time: endAt ? endAt.slice(11, 16) || null : null,
      reservation_required: true,
      booking_reference: referenceCode || null,
      notes: `สร้างอัตโนมัติจาก Booking Import V10${documentId ? " · linked document" : ""}`,
      sort_order: count || 0,
      created_by: userId,
    }).select("id").single();
    if (segmentError) throw new Error(`Booking ถูกสร้างแล้ว แต่สร้าง Transport ไม่สำเร็จ: ${segmentError.message}`);
    createdTransportId = segment?.id || "";
    if (createdTransportId) {
      details.linked_transport_id = createdTransportId;
      await supabase.from("bookings").update({ details }).eq("id", booking.id).eq("trip_id", tripId);
    }
  }

  for (const path of [
    `/trips/${tripId}`,
    `/trips/${tripId}/bookings`,
    `/trips/${tripId}/documents`,
    `/trips/${tripId}/timeline`,
    `/trips/${tripId}/command-center`,
    `/trips/${tripId}/transport`,
    "/today",
  ]) revalidatePath(path);

  return { bookingId: booking.id, documentId, transportId: createdTransportId || requestedTransportId };
}
