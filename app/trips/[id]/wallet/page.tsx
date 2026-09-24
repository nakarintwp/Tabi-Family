import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WalletHubTabs } from "@/components/HubTabs";
import { SubmitButton } from "@/components/SubmitButton";
import { addBooking, addExpense, deleteBooking, deleteExpense } from "./actions";
import { requireVerifiedUser } from "@/lib/supabase/auth";

const bookingMeta: Record<string, { icon: string; label: string }> = {
  flight: { icon: "✈️", label: "Flight" },
  hotel: { icon: "🏨", label: "Hotel" },
  train: { icon: "🚄", label: "Train" },
  bus: { icon: "🚌", label: "Bus" },
  rental_car: { icon: "🚙", label: "Rental car" },
  ticket: { icon: "🎟️", label: "Ticket" },
  restaurant: { icon: "🍽️", label: "Restaurant" },
  document: { icon: "📄", label: "Document" },
  other: { icon: "📌", label: "Other" },
};
const expenseIcon: Record<string, string> = { food: "🍜", transport: "🚆", hotel: "🏨", ticket: "🎟️", shopping: "🛍️", other: "💴" };

function fmtDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function TripWalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/wallet`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,budget,currency,bookings(id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes,created_at),expenses(id,amount,currency,category,note,paid_at,created_at)")
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const { data: accessRole } = await supabase.rpc("trip_access_role", { p_trip_id: id });
  const role = (accessRole || "viewer") as "owner" | "editor" | "viewer";
  const canEdit = role === "owner" || role === "editor";

  const bookings = [...(trip.bookings || [])].sort((a, b) => String(a.start_at || a.created_at).localeCompare(String(b.start_at || b.created_at)));
  const expenses = [...(trip.expenses || [])].sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)));
  const thb = expenses.filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);
  const jpy = expenses.filter((e) => e.currency === "JPY").reduce((sum, e) => sum + Number(e.amount), 0);
  const percent = trip.budget ? Math.min(100, Math.round((thb / Number(trip.budget)) * 100)) : 0;

  return (
    <main className="shell"><div className="container"><AppHeader />
      <div className="planner-topbar"><Link href={`/trips/${trip.id}`} className="back-link">‹ Trip</Link><div className="planner-role-row"><span className="planner-counter">Wallet Hub · V11.3</span><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></div></div>
      <section className="planner-hero wallet-hero"><div><div className="eyebrow">BOOKING · DOCUMENTS · EXPENSE</div><h1>🎫 Trip Wallet</h1><p>{trip.title}</p></div><div className="master-hero-actions">{canEdit && <Link className="btn btn-primary btn-small" href={`/trips/${trip.id}/import-booking`}>+ Import</Link>}<span className="planner-count-badge">{bookings.length} booking</span></div></section>

      <WalletHubTabs tripId={trip.id} active="overview" />

      <section className="dashboard-grid wallet-metrics">
        <div className="card dashboard-metric"><span>ใช้ที่ญี่ปุ่น</span><strong>¥{jpy.toLocaleString("th-TH")}</strong><small>{expenses.filter((e) => e.currency === "JPY").length} รายการ</small></div>
        <div className="card dashboard-metric"><span>ค่าใช้จ่าย THB</span><strong>฿{thb.toLocaleString("th-TH")}</strong><small>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</small></div>
      </section>
      {trip.budget ? <section className="card budget-card"><div className="section-head"><strong>Budget usage</strong><span>{percent}%</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><p className="small muted">คงเหลือประมาณ ฿{Math.max(0, Number(trip.budget) - thb).toLocaleString("th-TH")}</p></section> : null}

      <section className="section">
        <div className="section-head"><h2>Bookings</h2><span className="small muted">{bookings.length} รายการ</span></div>
        <div className="booking-list">
          {bookings.length ? bookings.map((booking) => {
            const meta = bookingMeta[booking.booking_type] || bookingMeta.other;
            return <article className="booking-card" key={booking.id}>
              <div className="booking-icon">{meta.icon}</div>
              <div className="booking-copy">
                <div className="activity-label">{meta.label}</div>
                <h3>{booking.title || booking.provider || meta.label}</h3>
                {booking.provider && <p>{booking.provider}</p>}
                {booking.reference_code && <div className="reference-chip">Ref: {booking.reference_code}</div>}
                {booking.start_at && <p>🗓️ {fmtDate(booking.start_at)}</p>}
                {booking.notes && <p className="muted">{booking.notes}</p>}
                {booking.confirmation_url && <a className="micro-link" href={booking.confirmation_url} target="_blank" rel="noreferrer">เปิด Confirmation ↗</a>}
              </div>
              {canEdit && <form action={deleteBooking}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="booking_id" value={booking.id} /><button className="icon-danger" aria-label="ลบ booking">×</button></form>}
            </article>;
          }) : <div className="empty-mini">ยังไม่มี Booking — เพิ่ม Flight, Hotel, Train หรือตั๋วไว้ที่นี่</div>}
        </div>

        {canEdit && <details className="add-activity-panel">
          <summary><span className="plus-circle">＋</span><span><strong>เพิ่ม Booking</strong><small>เก็บเลขจองและลิงก์ confirmation</small></span></summary>
          <form className="inline-form" action={addBooking}>
            <input type="hidden" name="trip_id" value={trip.id} />
            <div className="grid2"><select className="select" name="booking_type" defaultValue="flight"><option value="flight">✈️ Flight</option><option value="hotel">🏨 Hotel</option><option value="train">🚄 Train</option><option value="ticket">🎟️ Ticket</option><option value="restaurant">🍽️ Restaurant</option><option value="other">📌 Other</option></select><input className="input" name="title" placeholder="เช่น TG676 BKK → NRT" required /></div>
            <div className="grid2"><input className="input" name="provider" placeholder="ผู้ให้บริการ เช่น Thai Airways" /><input className="input" name="reference_code" placeholder="Booking / Confirmation code" /></div>
            <div className="grid2"><div className="field"><label>เริ่ม</label><input className="input" type="datetime-local" name="start_at" /></div><div className="field"><label>สิ้นสุด</label><input className="input" type="datetime-local" name="end_at" /></div></div>
            <input className="input" type="url" name="confirmation_url" placeholder="ลิงก์ confirmation / ticket (ไม่บังคับ)" />
            <textarea className="textarea" name="notes" rows={3} placeholder="Seat, terminal, check-in note..." />
            <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">+ บันทึก Booking</SubmitButton>
          </form>
        </details>}
      </section>

      <section className="section">
        <div className="section-head"><h2>Expenses</h2><span className="small muted">{expenses.length} รายการ</span></div>
        <div className="expense-list">
          {expenses.length ? expenses.map((expense) => <div className="expense-row" key={expense.id}>
            <div className="expense-icon">{expenseIcon[expense.category] || "💴"}</div>
            <div className="expense-copy"><strong>{expense.note || expense.category}</strong><small>{new Date(expense.paid_at).toLocaleDateString("th-TH")} · {expense.category}</small></div>
            <strong className="expense-amount">{expense.currency === "JPY" ? "¥" : "฿"}{Number(expense.amount).toLocaleString("th-TH")}</strong>
            {canEdit && <form action={deleteExpense}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="expense_id" value={expense.id} /><button className="icon-danger" aria-label="ลบค่าใช้จ่าย">×</button></form>}
          </div>) : <div className="empty-mini">ยังไม่มีค่าใช้จ่าย</div>}
        </div>

        {canEdit && <details className="add-activity-panel">
          <summary><span className="plus-circle">＋</span><span><strong>บันทึกค่าใช้จ่าย</strong><small>JPY / THB โดยไม่ต้องต่อ API ค่าเงิน</small></span></summary>
          <form className="inline-form" action={addExpense}>
            <input type="hidden" name="trip_id" value={trip.id} />
            <div className="grid2"><input className="input" name="amount" type="number" min="0.01" step="0.01" placeholder="จำนวนเงิน" required /><select className="select" name="currency" defaultValue="JPY"><option value="JPY">JPY ¥</option><option value="THB">THB ฿</option></select></div>
            <div className="grid2"><select className="select" name="category" defaultValue="food"><option value="food">อาหาร</option><option value="transport">เดินทาง</option><option value="hotel">โรงแรม</option><option value="ticket">ตั๋ว</option><option value="shopping">ช้อปปิ้ง</option><option value="other">อื่น ๆ</option></select><input className="input" name="paid_date" type="date" /></div>
            <input className="input" name="note" placeholder="เช่น Dinner at Shibuya" />
            <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">+ บันทึกค่าใช้จ่าย</SubmitButton>
          </form>
        </details>}
      </section>
    </div><BottomNav active="/wallet" tripId={trip.id} /></main>
  );
}
