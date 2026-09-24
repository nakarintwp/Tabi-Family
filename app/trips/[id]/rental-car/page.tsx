import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { durationLabel, mapsDirectionsUrl, mapsSearchUrlV8, type V8Transport } from "@/lib/v8";

type Day = { id: string; trip_date: string; title: string | null };

export default async function RentalCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/rental-car`);
  const [{ data: trip }, { data: segments }] = await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.from("transport_segments").select("id,trip_id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id", id).eq("mode", "car").order("sort_order").order("created_at"),
  ]);
  if (!trip) notFound();
  const days = ([...(trip.trip_days || [])] as Day[]).sort((a, b) => a.trip_date.localeCompare(b.trip_date));
  const dayIndex = new Map(days.map((d, i) => [d.id, i]));
  const rows = (segments || []) as V8Transport[];

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/more`} className="back-link">‹ More</Link><span className="planner-counter">V8.3 Rental Car Pro</span></div>
    <section className="planner-hero v8-rental-hero"><div><span className="eyebrow">ROAD TRIP CONTROL</span><h1>🚙 Rental Car Pro</h1><p>{trip.title} · จุดรับ/คืนรถ ETC ยางหิมะ น้ำมัน ที่จอดรถ และเส้นทาง</p></div><Link className="btn btn-primary" href={`/trips/${id}/transport#rental-car`}>+ เพิ่มรถเช่า</Link></section>

    <section className="rental-pro-checks">
      <div className="card"><strong>🪪 เอกสาร</strong><span>ใบขับขี่ + เอกสารที่บริษัทเช่ารถกำหนด</span></div>
      <div className="card"><strong>🛣️ ETC / Toll</strong><span>ยืนยัน ETC card และวิธีชำระค่าทางด่วน</span></div>
      <div className="card"><strong>❄️ Winter</strong><span>พื้นที่หิมะให้ยืนยัน Snow tire / chain</span></div>
      <div className="card"><strong>⛽ Fuel</strong><span>เช็กนโยบาย Full-to-Full และปั๊มก่อนคืนรถ</span></div>
      <div className="card"><strong>🅿️ Parking</strong><span>บันทึกที่จอดใกล้จุดเที่ยวและโรงแรม</span></div>
      <div className="card"><strong>⏰ Return buffer</strong><span>เผื่อเวลาเติมน้ำมัน รถติด และตรวจรถก่อนคืน</span></div>
    </section>

    <section className="section"><div className="section-head"><h2>ช่วงรถเช่า</h2><Link className="link" href={`/trips/${id}/transport`}>แก้ Transport ›</Link></div>
      {rows.length ? <div className="rental-pro-list">{rows.map((s) => { const idx = s.day_id ? dayIndex.get(s.day_id) : undefined; return <article className="rental-pro-card" key={s.id}>
        <div className="rental-pro-head"><div><span>{idx != null ? `DAY ${idx + 1}` : "TRIP"}</span><h2>{s.origin} → {s.destination}</h2></div><span className="rental-car-badge">🚙 RENTAL</span></div>
        <div className="rental-pro-grid"><div><span>บริษัท</span><strong>{s.operator || "ยังไม่ระบุ"}</strong></div><div><span>รถ / Class</span><strong>{s.service_name || "ยังไม่ระบุ"}</strong></div><div><span>รับรถ</span><strong>{s.departure_time?.slice(0,5) || "—"}</strong></div><div><span>คืน / ถึง</span><strong>{s.arrival_time?.slice(0,5) || "—"}</strong></div><div><span>ระยะเวลา</span><strong>{durationLabel(s.departure_time, s.arrival_time) || "—"}</strong></div><div><span>Booking</span><strong>{s.booking_reference || "ควรเพิ่มเลขจอง"}</strong></div></div>
        {s.seat && <div className="rental-detail-line"><strong>รายละเอียด:</strong> {s.seat}</div>}{s.notes && <div className="rental-detail-line"><strong>Note:</strong> {s.notes}</div>}
        <div className="rental-pro-actions"><a className="btn btn-primary btn-small" href={mapsDirectionsUrl(s.origin, s.destination, "driving")} target="_blank" rel="noreferrer">นำทาง</a><a className="btn btn-secondary btn-small" href={mapsSearchUrlV8(`parking near ${s.destination}`)} target="_blank" rel="noreferrer">🅿️ Parking</a><a className="btn btn-secondary btn-small" href={mapsSearchUrlV8(`gas station near ${s.destination}`)} target="_blank" rel="noreferrer">⛽ ปั๊ม</a><a className="btn btn-secondary btn-small" href={mapsSearchUrlV8(`service area between ${s.origin} and ${s.destination}`)} target="_blank" rel="noreferrer">☕ Rest Area</a></div>
      </article>; })}</div> : <div className="empty-state"><div className="empty-icon">🚙</div><h2>ยังไม่มีรถเช่า</h2><p>เพิ่ม Rental car ใน Transport แล้วหน้านี้จะรวมข้อมูลและเครื่องมือสำหรับขับรถให้</p><Link className="btn btn-primary" href={`/trips/${id}/transport#rental-car`}>เพิ่มรถเช่า</Link></div>}
    </section>
    <section className="notice rental-safety-note"><span>⚠️</span><div><strong>ก่อนออกเดินทาง</strong><p>ตรวจสภาพอากาศ/ถนนจริงและเงื่อนไขรถเช่าก่อนขับ โดยเฉพาะพื้นที่ภูเขาและหิมะ ข้อมูลในแอปเป็น checklist ไม่ใช่ข้อมูลถนนแบบ real-time</p></div></section>
  </div><BottomNav active="/more" tripId={id} /></main>;
}
