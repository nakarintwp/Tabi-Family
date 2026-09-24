import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { DocumentOfflinePack } from "@/components/DocumentOfflinePack";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addBooking, deleteBooking } from "../wallet/actions";

type DocRow = { id: string; title: string | null; provider: string | null; reference_code: string | null; confirmation_url: string | null; notes: string | null; details: Record<string, unknown> | null; created_at: string };

function detail(details: Record<string, unknown> | null, key: string) {
  const value = details?.[key];
  return typeof value === "string" ? value : "";
}

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/documents`);
  const [{ data: trip }, { data: docs }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title").eq("id", id).single(),
    supabase.from("bookings").select("id,title,provider,reference_code,confirmation_url,notes,details,created_at").eq("trip_id", id).eq("booking_type", "document").order("created_at", { ascending: false }),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const rows = (docs || []) as DocRow[];
  const canEdit = role === "owner" || role === "editor";
  const packItems = rows.map((d) => ({ title: d.title || "Document", reference: d.reference_code, url: d.confirmation_url, note: d.notes }));

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V8.7 Documents</span></div>
    <section className="planner-hero v8-doc-hero"><div><span className="eyebrow">TRIP DOCUMENT VAULT</span><h1>📂 Trip Documents</h1><p>{trip.title} · เก็บลิงก์ Voucher, Insurance, Ticket, Passport copy และเลขอ้างอิง</p></div><Link className="btn btn-secondary" href={`/trips/${id}/bookings`}>Booking Center</Link></section>

    <DocumentOfflinePack tripId={id} items={packItems}/>

    <section className="section"><div className="section-head"><h2>เอกสาร</h2><span className="small muted">{rows.length} รายการ</span></div>
      {rows.length ? <div className="document-grid">{rows.map((d) => <article className="document-card" key={d.id}><div className="document-icon">📄</div><div><span className="activity-label">{detail(d.details, "doc_category") || "Document"}</span><h3>{d.title || "Document"}</h3>{d.provider && <p>{d.provider}</p>}{d.reference_code && <div className="reference-chip">Ref: {d.reference_code}</div>}{d.notes && <p className="muted small">{d.notes}</p>}<div className="today-action-row">{d.confirmation_url && <a className="btn btn-primary btn-small" href={d.confirmation_url} target="_blank" rel="noreferrer">เปิดเอกสาร ↗</a>}{canEdit && <form action={deleteBooking}><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="booking_id" value={d.id}/><button className="btn btn-secondary btn-small">ลบ</button></form>}</div></div></article>)}</div> : <div className="empty-mini">ยังไม่มีเอกสาร</div>}
    </section>

    {canEdit && <details className="add-activity-panel"><summary><span className="plus-circle">＋</span><span><strong>เพิ่มเอกสาร / ลิงก์</strong><small>เก็บ URL จาก Drive, airline, hotel, insurance หรือ booking site</small></span></summary><form action={addBooking} className="inline-form"><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="booking_type" value="document"/><div className="grid2"><select className="select" name="doc_category" defaultValue="voucher"><option value="passport">Passport copy</option><option value="flight">Flight ticket</option><option value="hotel">Hotel voucher</option><option value="rental_car">Rental car</option><option value="insurance">Travel insurance</option><option value="rail_bus">JR / Bus ticket</option><option value="voucher">Voucher / QR</option><option value="other">Other</option></select><input className="input" name="title" placeholder="ชื่อเอกสาร" required/></div><div className="grid2"><input className="input" name="provider" placeholder="ผู้ให้บริการ"/><input className="input" name="reference_code" placeholder="เลขอ้างอิง"/></div><input className="input" name="confirmation_url" type="url" placeholder="https://... ลิงก์เอกสาร / QR / Voucher"/><textarea className="textarea" name="notes" rows={3} placeholder="หมายเหตุสำคัญ เช่น เลขกรมธรรม์ วันหมดอายุ หรือวิธีใช้"/><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">+ เพิ่มเอกสาร</SubmitButton></form></details>}
    <section className="notice"><span>🔐</span><div><strong>ข้อควรระวัง</strong><p>ไม่แนะนำให้ใส่รหัสผ่าน เลขบัตรเครดิต หรือข้อมูลลับลงใน Notes และควรตั้งสิทธิ์ของลิงก์เอกสารภายนอกให้เหมาะสม</p></div></section>
  </div><BottomNav active="/wallet" /></main>;
}
