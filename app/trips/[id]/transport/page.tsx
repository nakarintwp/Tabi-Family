import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addTransportSegment, deleteTransportSegment, updateTransportSegment } from "./actions";

type TransportSegment = { id: string; day_id: string | null; mode: string; operator: string | null; service_name: string | null; origin: string; destination: string; departure_time: string | null; arrival_time: string | null; reservation_required: boolean; booking_reference: string | null; seat: string | null; notes: string | null };
type TransportDay = { id: string; trip_date: string; title: string | null };

const modeMeta: Record<string, { icon: string; label: string }> = {
  train: { icon: "🚆", label: "Train" }, bus: { icon: "🚌", label: "Bus" }, flight: { icon: "✈️", label: "Flight" },
  car: { icon: "🚙", label: "Rental car / รถเช่า" }, taxi: { icon: "🚕", label: "Taxi" }, walk: { icon: "🚶", label: "Walk" }, ferry: { icon: "⛴️", label: "Ferry" }, other: { icon: "➡️", label: "Other" },
};

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function SegmentFields({ segment, days, defaultMode = "train" }: { segment?: Partial<TransportSegment>; days: TransportDay[]; defaultMode?: string }) {
  return <>
    <div className="grid2"><select className="select" name="day_id" defaultValue={segment?.day_id || ""}><option value="">ไม่ผูกกับ Day</option>{days.map((day: TransportDay, index: number) => <option value={day.id} key={day.id}>Day {index + 1} · {dayLabel(day.trip_date)}</option>)}</select><select className="select" name="mode" defaultValue={segment?.mode || defaultMode}>{Object.entries(modeMeta).map(([key, meta]) => <option key={key} value={key}>{meta.icon} {meta.label}</option>)}</select></div>
    <div className="grid2"><input className="input" name="origin" defaultValue={segment?.origin || ""} placeholder="ต้นทาง / จุดรับรถ เช่น Nagoya Station" required /><input className="input" name="destination" defaultValue={segment?.destination || ""} placeholder="ปลายทาง / จุดคืนรถ เช่น Takayama" required /></div>
    <div className="grid2"><input className="input" name="operator" defaultValue={segment?.operator || ""} placeholder="Operator / บริษัทเช่ารถ" /><input className="input" name="service_name" defaultValue={segment?.service_name || ""} placeholder="ขบวน / เที่ยว / รุ่นหรือคลาสรถ" /></div>
    <div className="grid2"><div className="field"><label>ออก / รับรถ</label><input className="input" type="time" name="departure_time" defaultValue={segment?.departure_time?.slice(0,5) || ""} /></div><div className="field"><label>ถึง / คืนรถ</label><input className="input" type="time" name="arrival_time" defaultValue={segment?.arrival_time?.slice(0,5) || ""} /></div></div>
    <div className="grid2"><input className="input" name="booking_reference" defaultValue={segment?.booking_reference || ""} placeholder="Booking ref" /><input className="input" name="seat" defaultValue={segment?.seat || ""} placeholder="Seat / ETC / Snow tire / รายละเอียดรถ" /></div>
    <label className="check-row"><input type="checkbox" name="reservation_required" defaultChecked={Boolean(segment?.reservation_required)} /><span>ต้องจองล่วงหน้า</span></label>
    <textarea className="textarea" name="notes" rows={3} defaultValue={segment?.notes || ""} placeholder="หมายเหตุ เช่น จุดรับรถ, ผู้ขับ, ETC, Snow tire, ที่จอดรถ, เผื่อเวลาเปลี่ยนชานชาลา" />
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
  const days: TransportDay[] = ([...(trip.trip_days || [])] as TransportDay[]).sort((a: TransportDay, b: TransportDay) => a.trip_date.localeCompare(b.trip_date));
  const typedSegments: TransportSegment[] = (segments || []) as TransportSegment[];
  const carSegments = typedSegments.filter((segment: TransportSegment) => segment.mode === "car");

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">Transport · V8.8</span></div>
    <section className="planner-hero transport-hero"><div><span className="eyebrow">JAPAN TRANSPORT</span><h1>🚆 Transport Segments</h1><p>รถไฟ รถบัส เที่ยวบิน Taxi เดิน และ Rental car อยู่ในแผนเดียวกัน</p></div><Link className="btn btn-secondary" href={`/trips/${id}/route`}>Trip Route</Link></section>

    {carSegments.length > 0 && <section className="rental-summary-banner"><span>🚙</span><div><strong>Rental car {carSegments.length} ช่วง</strong><p>ข้อมูลรถเช่าจะถูกรวมใน Trip Route อัตโนมัติ</p></div><Link href={`/trips/${id}/route`} className="link">ดู Route ›</Link></section>}

    <section className="transport-list">
      {typedSegments.length ? typedSegments.map((segment: TransportSegment) => { const meta = modeMeta[segment.mode] || modeMeta.other; const dayIndex = days.findIndex((d: TransportDay) => d.id === segment.day_id); const isCar = segment.mode === "car"; return <article className={`transport-card ${isCar ? "rental-transport-card" : ""}`} key={segment.id}>
        <div className="transport-icon">{meta.icon}</div>
        <div className="transport-main"><span className="activity-label">{dayIndex >= 0 ? `DAY ${dayIndex + 1} · ` : ""}{meta.label}{segment.operator ? ` · ${segment.operator}` : ""}</span><h2>{segment.origin} → {segment.destination}</h2><div className="transport-times"><strong>{segment.departure_time?.slice(0,5) || "—"}</strong><span>→</span><strong>{segment.arrival_time?.slice(0,5) || "—"}</strong></div>{segment.service_name && <p>{isCar ? `รถ/คลาส: ${segment.service_name}` : segment.service_name}</p>}<div className="tag-row">{segment.reservation_required && <span className="mini-tag">Reservation</span>}{segment.seat && <span className="mini-tag">{isCar ? segment.seat : `Seat ${segment.seat}`}</span>}{segment.booking_reference && <span className="mini-tag">Ref {segment.booking_reference}</span>}</div>{segment.notes && <p className="muted small">{segment.notes}</p>}{isCar && <div className="rental-inline-note">ตรวจเอกสารขับรถ · ETC/ทางด่วน · Snow tire เมื่อมีหิมะ · ที่จอดรถ · น้ำมัน</div>}</div>
        {canEdit && <div className="transport-card-actions"><details><summary>แก้ไข</summary><form action={updateTransportSegment} className="inline-form transport-edit-form"><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="segment_id" value={segment.id} /><SegmentFields segment={segment} days={days} /><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">บันทึก</SubmitButton></form></details><form action={deleteTransportSegment}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="segment_id" value={segment.id} /><button className="icon-danger" type="submit" aria-label="ลบ">×</button></form></div>}
      </article>}) : <div className="empty-mini">ยังไม่มีช่วงการเดินทาง — เพิ่มรถไฟ/รถบัส/รถเช่าไว้ตรงนี้</div>}
    </section>

    {canEdit && <details id="rental-car" className="add-activity-panel rental-add-panel"><summary><span className="plus-circle">🚙</span><span><strong>เพิ่ม Rental car / รถเช่า</strong><small>จุดรับรถ • จุดคืนรถ • บริษัท • Booking • ETC • Snow tire</small></span></summary><form className="inline-form" action={addTransportSegment}><input type="hidden" name="trip_id" value={id} /><SegmentFields days={days} defaultMode="car" /><div className="rental-form-tip"><strong>แนะนำให้บันทึกใน Notes</strong><span>ชื่อผู้ขับ · จุดรับ/คืนรถ · ETC · Snow tire/chain · ที่จอดรถ · แผนเติมน้ำมัน</span></div><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่ม...">+ เพิ่มรถเช่า</SubmitButton></form></details>}

    {canEdit && <details id="add-transport" className="add-activity-panel" open={!typedSegments.length}><summary><span className="plus-circle">＋</span><span><strong>เพิ่ม Transport Segment</strong><small>Train • Bus • Flight • Taxi • Walk • Ferry</small></span></summary><form className="inline-form" action={addTransportSegment}><input type="hidden" name="trip_id" value={id} /><SegmentFields days={days} /><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่ม...">+ เพิ่มการเดินทาง</SubmitButton></form></details>}
  </div><BottomNav active="/plan" /></main>;
}
