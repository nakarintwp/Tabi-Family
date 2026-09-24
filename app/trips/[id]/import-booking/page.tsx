import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { BookingImportWizard } from "@/components/BookingImportWizard";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export default async function ImportBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/import-booking`);
  const [{ data: trip }, { data: documents }, { data: transports }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,cities").eq("id", id).single(),
    supabase.from("bookings").select("id,title,provider,reference_code,details").eq("trip_id", id).eq("booking_type", "document").order("created_at", { ascending: false }),
    supabase.from("transport_segments").select("id,mode,origin,destination,booking_reference").eq("trip_id", id).order("sort_order"),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  if (!canEdit) return <main className="shell"><div className="container"><AppHeader/><div className="planner-topbar"><Link href={`/trips/${id}/bookings`} className="back-link">‹ Booking Center</Link></div><div className="error-box">Viewer สามารถดู Booking ได้ แต่ไม่สามารถนำเข้า/แก้ไขข้อมูล</div></div><BottomNav active="/wallet"/></main>;
  const documentRows = (documents || []).map((doc: any) => ({ id: doc.id, title: doc.title || "Document", provider: doc.provider, reference_code: doc.reference_code, doc_category: typeof doc.details?.doc_category === "string" ? doc.details.doc_category : null }));
  return <main className="shell"><div className="container"><AppHeader/>
    <div className="planner-topbar"><Link href={`/trips/${id}/bookings`} className="back-link">‹ Booking Center</Link><span className="planner-counter">V10.8 OCR + Smart Link</span></div>
    <section className="planner-hero import-booking-hero"><div><span className="eyebrow">BOOKING OCR + SMART LINK</span><h1>📥 Booking Import</h1><p>{trip.title} · วิเคราะห์ข้อมูลในเครื่องก่อน แล้วให้คุณตรวจยืนยันทุกช่องก่อนบันทึก</p></div><Link className="btn btn-secondary" href={`/trips/${id}/documents`}>Trip Documents</Link></section>
    <section className="section zero-cost-banner"><div className="zero-cost-icon">¥0</div><div><strong>OCR ใน Browser + ไม่ใช้ Paid AI API</strong><p>รูป JPG/PNG/WEBP ใช้ Tesseract.js ฝั่งอุปกรณ์ จากนั้นส่งข้อความเข้า rule-based parser เดิม กรุณาตรวจข้อมูลก่อนบันทึกทุกครั้ง</p></div></section>
    <BookingImportWizard tripId={id} tripTitle={trip.title} tripCities={trip.cities || []} documents={documentRows} transports={transports || []}/>
  </div><BottomNav active="/wallet"/></main>;
}
