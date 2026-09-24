import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { japanDateKey, type V8Day, type V8Transport } from "@/lib/v8";

type Booking = { id: string; booking_type: string; title: string | null; provider: string | null; reference_code: string | null; start_at: string | null; end_at: string | null; details: Record<string, unknown> | null };

function icon(type?: string | null) {
  if (type === "food") return "🍜";
  if (type === "shopping") return "🛍️";
  if (type === "hotel") return "🏨";
  if (type === "transport") return "🚆";
  return "📍";
}

function modeIcon(mode: string) {
  return mode === "car" ? "🚙" : mode === "train" ? "🚆" : mode === "bus" ? "🚌" : mode === "flight" ? "✈️" : mode === "walk" ? "🚶" : mode === "taxi" ? "🚕" : "➡️";
}

export default async function MasterPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/master-plan`);
  const [{ data: trip }, { data: transports }, { data: bookings }] = await Promise.all([
    supabase.from("trips").select("id,title,start_date,end_date,cities,trip_days(id,trip_date,title,notes,activities(id,title,activity_type,start_time,duration_minutes,location_name,sort_order,status))").eq("id", id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id", id).order("sort_order").order("created_at"),
    supabase.from("bookings").select("id,booking_type,title,provider,reference_code,start_at,end_at,details").eq("trip_id", id).order("start_at", { ascending: true, nullsFirst: false }),
  ]);
  if (!trip) notFound();

  const days = ([...(trip.trip_days || [])] as V8Day[]).sort((a, b) => a.trip_date.localeCompare(b.trip_date));
  const transportRows = (transports || []) as V8Transport[];
  const bookingRows = (bookings || []) as Booking[];

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V8.0 Master Plan</span></div>
    <section className="planner-hero v8-master-hero"><div><span className="eyebrow">ONE VIEW · WHOLE TRIP</span><h1>🧭 Trip Master Plan</h1><p>{trip.title} · ที่เที่ยว การเดินทาง และ Booking ใน Timeline เดียว</p></div><div className="master-hero-actions"><Link className="btn btn-secondary" href={`/trips/${id}/conflicts`}>ตรวจแผน ⚠️</Link><Link className="btn btn-primary" href="/today">Today Mode</Link></div></section>

    <section className="master-summary-grid">
      <div className="card dashboard-metric"><span>วันเดินทาง</span><strong>{days.length}</strong><small>{trip.start_date || "—"} → {trip.end_date || "—"}</small></div>
      <div className="card dashboard-metric"><span>เมือง</span><strong>{trip.cities?.length || 0}</strong><small>{trip.cities?.join(" • ") || "ยังไม่เลือก"}</small></div>
      <div className="card dashboard-metric"><span>Booking</span><strong>{bookingRows.length}</strong><small>Flight · Hotel · Ticket · Restaurant</small></div>
      <div className="card dashboard-metric"><span>Transport</span><strong>{transportRows.length}</strong><small>รวมรถเช่า {transportRows.filter((x) => x.mode === "car").length} ช่วง</small></div>
    </section>

    <section className="section master-days">
      <div className="section-head"><h2>แผนทั้งหมด</h2><Link className="link" href={`/trips/${id}/calendar`}>Calendar ›</Link></div>
      {days.length ? days.map((day, dayIndex) => {
        const activities = [...(day.activities || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const dayTransports = transportRows.filter((t) => t.day_id === day.id);
        const dayBookings = bookingRows.filter((b) => japanDateKey(b.start_at) === day.trip_date);
        return <article className="master-day-card" key={day.id}>
          <div className="master-day-head"><div><span>DAY {dayIndex + 1}</span><h2>{day.title || "แผนเดินทาง"}</h2><small>{new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${day.trip_date}T00:00:00`))}</small></div><Link className="btn btn-secondary btn-small" href={`/trips/${id}/days/${day.id}`}>แก้ Day</Link></div>
          <div className="master-lanes">
            <div className="master-lane"><strong className="master-lane-title">🗓️ Itinerary</strong>{activities.length ? activities.map((a) => <div className="master-row" key={a.id}><time>{a.start_time?.slice(0, 5) || "—"}</time><span>{icon(a.activity_type)}</span><div><strong>{a.title}</strong>{a.location_name && <small>{a.location_name}</small>}</div><em className={`mini-status ${a.status || "planned"}`}>{a.status || "planned"}</em></div>) : <div className="empty-mini">ยังไม่มีกิจกรรม</div>}</div>
            <div className="master-lane"><strong className="master-lane-title">🚆 การเดินทาง</strong>{dayTransports.length ? dayTransports.map((t) => <div className="master-row" key={t.id}><time>{t.departure_time?.slice(0,5) || "—"}</time><span>{modeIcon(t.mode)}</span><div><strong>{t.origin} → {t.destination}</strong><small>{t.operator || t.service_name || t.mode}</small></div></div>) : <div className="empty-mini">ไม่มี Transport ที่ผูกกับวันนี้</div>}</div>
            <div className="master-lane"><strong className="master-lane-title">🎫 Booking</strong>{dayBookings.length ? dayBookings.map((b) => <div className="master-row" key={b.id}><time>{b.start_at ? new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(b.start_at)) : "—"}</time><span>🎟️</span><div><strong>{b.title || b.provider || b.booking_type}</strong>{b.reference_code && <small>Ref {b.reference_code}</small>}</div></div>) : <div className="empty-mini">ไม่มี Booking วันที่นี้</div>}</div>
          </div>
        </article>;
      }) : <div className="empty-state"><div className="empty-icon">🗓️</div><h2>ยังไม่มีวันเดินทาง</h2><p>สร้าง Trip Days ก่อน แล้ว Master Plan จะรวมข้อมูลให้โดยอัตโนมัติ</p></div>}
    </section>
  </div><BottomNav active="/plan" /></main>;
}
