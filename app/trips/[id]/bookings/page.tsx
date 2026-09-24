import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WalletHubTabs } from "@/components/HubTabs";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addBooking, deleteBooking } from "../wallet/actions";

type Booking = { id: string; booking_type: string; title: string | null; provider: string | null; reference_code: string | null; start_at: string | null; end_at: string | null; confirmation_url: string | null; notes: string | null; details: Record<string, unknown> | null; created_at: string };

const meta: Record<string, { icon: string; label: string }> = {
  flight: { icon: "✈️", label: "Flight" }, hotel: { icon: "🏨", label: "Hotel" }, train: { icon: "🚄", label: "Train" }, bus: { icon: "🚌", label: "Bus" }, rental_car: { icon: "🚙", label: "Rental car" }, ticket: { icon: "🎟️", label: "Ticket" }, restaurant: { icon: "🍽️", label: "Restaurant" }, document: { icon: "📄", label: "Document" }, other: { icon: "📌", label: "Other" },
};

function detailText(details: Record<string, unknown> | null, key: string) {
  const value = details?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export default async function BookingCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/bookings`);
  const [{ data: trip }, { data: bookings }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title").eq("id", id).single(),
    supabase.from("bookings").select("id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes,details,created_at").eq("trip_id", id).neq("booking_type", "document").order("start_at", { ascending: true, nullsFirst: false }),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const rows = (bookings || []) as Booking[];
  const confirmed = rows.filter((b) => detailText(b.details, "status") === "confirmed").length;
  const unpaid = rows.filter((b) => detailText(b.details, "payment_status") === "unpaid").length;

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/wallet`} className="back-link">‹ Wallet</Link><span className="planner-counter">V10.0 Auto Import Ready</span></div>
    <section className="planner-hero v8-booking-hero"><div><span className="eyebrow">RESERVATION CONTROL</span><h1>🎫 Booking & Reservation</h1><p>{trip.title} · รวมเลขจอง เวลา สถานะชำระเงิน และ Confirmation</p></div><div className="master-hero-actions"><Link className="btn btn-primary" href={`/trips/${id}/import-booking`}>📥 Auto Import</Link><Link className="btn btn-secondary" href={`/trips/${id}/documents`}>Documents</Link></div></section>

    <section className="master-summary-grid"><div className="card dashboard-metric"><span>ทั้งหมด</span><strong>{rows.length}</strong><small>รายการจอง</small></div><div className="card dashboard-metric"><span>Confirmed</span><strong>{confirmed}</strong><small>ยืนยันแล้ว</small></div><div className="card dashboard-metric"><span>รอชำระ</span><strong>{unpaid}</strong><small>ตรวจ Payment</small></div></section>

    <WalletHubTabs tripId={id} active="bookings" />
    <section className="section"><div className="section-head"><h2>รายการจอง</h2><span className="small muted">เรียงตามเวลาเดินทาง</span></div>
      <div className="v8-booking-grid">{rows.length ? rows.map((b) => { const m = meta[b.booking_type] || meta.other; const status = detailText(b.details, "status") || "planned"; const pay = detailText(b.details, "payment_status") || "unknown"; return <article className="v8-booking-card" key={b.id}><div className="v8-booking-card-head"><span>{m.icon}</span><div><small>{m.label}</small><h3>{b.title || b.provider || m.label}</h3></div><span className={`booking-state state-${status}`}>{status}</span></div>{b.provider && <p>{b.provider}</p>}<div className="tag-row">{b.reference_code && <span className="mini-tag">Ref {b.reference_code}</span>}<span className="mini-tag">Payment: {pay}</span>{b.details?.auto_import_v10 === true && <span className="mini-tag">V10 Imported</span>}{detailText(b.details, "linked_document_id") && <span className="mini-tag">Document linked</span>}{detailText(b.details, "party_size") && <span className="mini-tag">{detailText(b.details, "party_size")} คน</span>}</div>{b.start_at && <p>🗓️ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(b.start_at))}</p>}{detailText(b.details, "amount") && <p>💴 {detailText(b.details, "amount")} {detailText(b.details, "currency") || "JPY"}</p>}{detailText(b.details, "contact") && <p>☎️ {detailText(b.details, "contact")}</p>}{b.notes && <p className="muted small">{b.notes}</p>}<div className="today-action-row">{b.confirmation_url && <a className="btn btn-secondary btn-small" href={b.confirmation_url} target="_blank" rel="noreferrer">เปิด Confirmation</a>}{canEdit && <form action={deleteBooking}><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="booking_id" value={b.id}/><button className="btn btn-secondary btn-small" type="submit">ลบ</button></form>}</div></article>; }) : <div className="empty-mini">ยังไม่มี Booking</div>}</div>
    </section>

    {canEdit && <details className="add-activity-panel" open={!rows.length}><summary><span className="plus-circle">＋</span><span><strong>เพิ่ม Booking</strong><small>Flight · Hotel · Train · Bus · Rental car · Restaurant · Ticket</small></span></summary><form className="inline-form" action={addBooking}>
      <input type="hidden" name="trip_id" value={id}/>
      <div className="grid2"><select className="select" name="booking_type" defaultValue="hotel"><option value="flight">✈️ Flight</option><option value="hotel">🏨 Hotel</option><option value="train">🚄 Train</option><option value="bus">🚌 Bus</option><option value="rental_car">🚙 Rental car</option><option value="restaurant">🍽️ Restaurant</option><option value="ticket">🎟️ Ticket</option><option value="other">📌 Other</option></select><input className="input" name="title" placeholder="ชื่อการจอง" required/></div>
      <div className="grid2"><input className="input" name="provider" placeholder="Provider / โรงแรม / บริษัท"/><input className="input" name="reference_code" placeholder="Booking / Confirmation code"/></div>
      <div className="grid2"><div className="field"><label>เริ่ม</label><input className="input" type="datetime-local" name="start_at"/></div><div className="field"><label>สิ้นสุด</label><input className="input" type="datetime-local" name="end_at"/></div></div>
      <div className="grid2"><select className="select" name="status" defaultValue="confirmed"><option value="planned">Planned</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select><select className="select" name="payment_status" defaultValue="paid"><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="unknown">Unknown</option></select></div>
      <div className="grid2"><input className="input" name="amount" type="number" min="0" step="0.01" placeholder="ยอดจอง"/><select className="select" name="booking_currency" defaultValue="JPY"><option value="JPY">JPY ¥</option><option value="THB">THB ฿</option></select></div>
      <div className="grid2"><input className="input" name="party_size" type="number" min="1" placeholder="จำนวนคน"/><input className="input" name="contact" placeholder="เบอร์โทร / Contact"/></div>
      <input className="input" type="url" name="confirmation_url" placeholder="Confirmation / Ticket URL"/>
      <textarea className="textarea" name="notes" rows={3} placeholder="Seat, terminal, check-in, cancellation policy..."/>
      <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">+ บันทึก Booking</SubmitButton>
    </form></details>}
  </div><BottomNav active="/wallet" tripId={id} /></main>;
}
