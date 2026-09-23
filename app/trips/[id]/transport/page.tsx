import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addTransportSegment, deleteTransportSegment, updateTransportSegment } from "./actions";

const modeMeta: Record<string, { icon: string; label: string }> = {
  train: { icon: "🚆", label: "Train" }, bus: { icon: "🚌", label: "Bus" }, flight: { icon: "✈️", label: "Flight" },
  car: { icon: "🚗", label: "Car" }, taxi: { icon: "🚕", label: "Taxi" }, walk: { icon: "🚶", label: "Walk" }, ferry: { icon: "⛴️", label: "Ferry" }, other: { icon: "➡️", label: "Other" },
};

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function SegmentFields({ segment, days }: { segment?: any; days: any[] }) {
  return <>
    <div className="grid2"><select className="select" name="day_id" defaultValue={segment?.day_id || ""}><option value="">ไม่ผูกกับ Day</option>{days.map((day, index) => <option value={day.id} key={day.id}>Day {index + 1} · {dayLabel(day.trip_date)}</option>)}</select><select className="select" name="mode" defaultValue={segment?.mode || "train"}>{Object.entries(modeMeta).map(([key, meta]) => <option key={key} value={key}>{meta.icon} {meta.label}</option>)}</select></div>
    <div className="grid2"><input className="input" name="origin" defaultValue={segment?.origin || ""} placeholder="ต้นทาง เช่น Nagoya" required /><input className="input" name="destination" defaultValue={segment?.destination || ""} placeholder="ปลายทาง เช่น Takayama" required /></div>
    <div className="grid2"><input className="input" name="operator" defaultValue={segment?.operator || ""} placeholder="Operator เช่น JR Central" /><input className="input" name="service_name" defaultValue={segment?.service_name || ""} placeholder="Hida 3 / Nohi Bus" /></div>
    <div className="grid2"><div className="field"><label>ออก</label><input className="input" type="time" name="departure_time" defaultValue={segment?.departure_time?.slice(0,5) || ""} /></div><div className="field"><label>ถึง</label><input className="input" type="time" name="arrival_time" defaultValue={segment?.arrival_time?.slice(0,5) || ""} /></div></div>
    <div className="grid2"><input className="input" name="booking_reference" defaultValue={segment?.booking_reference || ""} placeholder="Booking ref" /><input className="input" name="seat" defaultValue={segment?.seat || ""} placeholder="Car / Seat" /></div>
    <label className="check-row"><input type="checkbox" name="reservation_required" defaultChecked={Boolean(segment?.reservation_required)} /><span>ต้องจองล่วงหน้า</span></label>
    <textarea className="textarea" name="notes" rows={2} defaultValue={segment?.notes || ""} placeholder="หมายเหตุ เช่น เผื่อเวลาเปลี่ยนชานชาลา" />
  </>;
}

export default async function TransportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/transport`);
  const [{ data: trip }, { data: segments }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.from("transport_segments").select("*").eq("trip_id", id).order("sort_order").order("created_at"),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const days = [...(trip.trip_days || [])].sort((a,b) => a.trip_date.localeCompare(b.trip_date));

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">Transport</span></div>
    <section className="planner-hero transport-hero"><div><span className="eyebrow">JAPAN TRANSPORT</span><h1>🚆 Transport Segments</h1><p>เก็บรถไฟ รถบัส เที่ยวบิน และข้อมูลที่นั่งเป็นช่วงการเดินทาง</p></div><Link className="btn btn-secondary" href={`/trips/${id}/calendar`}>Calendar</Link></section>

    <section className="transport-list">
      {segments?.length ? segments.map((segment) => { const meta = modeMeta[segment.mode] || modeMeta.other; const dayIndex = days.findIndex((d) => d.id === segment.day_id); return <article className="transport-card" key={segment.id}>
        <div className="transport-icon">{meta.icon}</div>
        <div className="transport-main"><span className="activity-label">{dayIndex >= 0 ? `DAY ${dayIndex + 1} · ` : ""}{meta.label}{segment.operator ? ` · ${segment.operator}` : ""}</span><h2>{segment.origin} → {segment.destination}</h2><div className="transport-times"><strong>{segment.departure_time?.slice(0,5) || "—"}</strong><span>→</span><strong>{segment.arrival_time?.slice(0,5) || "—"}</strong></div>{segment.service_name && <p>{segment.service_name}</p>}<div className="tag-row">{segment.reservation_required && <span className="mini-tag">Reservation</span>}{segment.seat && <span className="mini-tag">Seat {segment.seat}</span>}{segment.booking_reference && <span className="mini-tag">Ref {segment.booking_reference}</span>}</div>{segment.notes && <p className="muted small">{segment.notes}</p>}</div>
        {canEdit && <div className="transport-card-actions"><details><summary>แก้ไข</summary><form action={updateTransportSegment} className="inline-form transport-edit-form"><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="segment_id" value={segment.id} /><SegmentFields segment={segment} days={days} /><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">บันทึก</SubmitButton></form></details><form action={deleteTransportSegment}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="segment_id" value={segment.id} /><button className="icon-danger" type="submit" aria-label="ลบ">×</button></form></div>}
      </article>}) : <div className="empty-mini">ยังไม่มีช่วงการเดินทาง — เพิ่มรถไฟ/รถบัสระหว่างเมืองไว้ตรงนี้</div>}
    </section>

    {canEdit && <details className="add-activity-panel" open={!segments?.length}><summary><span className="plus-circle">＋</span><span><strong>เพิ่ม Transport Segment</strong><small>รถไฟ • รถบัส • Flight • รถเช่า</small></span></summary><form className="inline-form" action={addTransportSegment}><input type="hidden" name="trip_id" value={id} /><SegmentFields days={days} /><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่ม...">+ เพิ่มการเดินทาง</SubmitButton></form></details>}
  </div><BottomNav active="/plan" /></main>;
}
