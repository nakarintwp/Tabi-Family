import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PlanHubTabs } from "@/components/HubTabs";
import { requireVerifiedUser } from "@/lib/supabase/auth";

const modeMeta: Record<string, { icon: string; label: string; travelMode: string }> = {
  train: { icon: "🚆", label: "Train", travelMode: "transit" },
  bus: { icon: "🚌", label: "Bus", travelMode: "transit" },
  flight: { icon: "✈️", label: "Flight", travelMode: "driving" },
  car: { icon: "🚙", label: "Rental car / รถเช่า", travelMode: "driving" },
  taxi: { icon: "🚕", label: "Taxi", travelMode: "driving" },
  walk: { icon: "🚶", label: "Walk", travelMode: "walking" },
  ferry: { icon: "⛴️", label: "Ferry", travelMode: "transit" },
  other: { icon: "➡️", label: "Other", travelMode: "driving" },
};

type RouteDay = { id: string; trip_date: string; title: string | null };
type RouteSegment = {
  id: string; day_id: string | null; mode: string; operator: string | null; service_name: string | null;
  origin: string; destination: string; departure_time: string | null; arrival_time: string | null;
  reservation_required: boolean; booking_reference: string | null; seat: string | null; notes: string | null;
};

function durationText(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return null;
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours ? `${hours} ชม. ` : ""}${mins ? `${mins} นาที` : hours ? "" : "0 นาที"}`.trim();
}

function directionsUrl(origin: string, destination: string, mode: string) {
  const params = new URLSearchParams({ api: "1", origin: `${origin}, Japan`, destination: `${destination}, Japan`, travelmode: modeMeta[mode]?.travelMode || "driving" });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default async function TripRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/route`);
  const [{ data: trip }, { data: segments }] = await Promise.all([
    supabase.from("trips").select("id,title,cities,trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.from("transport_segments").select("*").eq("trip_id", id).order("sort_order").order("created_at"),
  ]);
  if (!trip) notFound();
  const days: RouteDay[] = ([...(trip.trip_days || [])] as RouteDay[]).sort((a: RouteDay, b: RouteDay) => a.trip_date.localeCompare(b.trip_date));
  const dayIndex = new Map(days.map((day, index) => [day.id, index]));
  const rows: RouteSegment[] = (segments || []) as RouteSegment[];
  const carCount = rows.filter((segment: RouteSegment) => segment.mode === "car").length;
  const routeCities: string[] = rows.length ? [rows[0].origin, ...rows.map((segment: RouteSegment) => segment.destination)] : ((trip.cities || []) as string[]);

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/master-plan`} className="back-link">‹ Plan</Link><span className="planner-counter">V8.8 Trip Route</span></div>
    <section className="planner-hero route-view-hero"><div><span className="eyebrow">TRIP ROUTE VIEW</span><h1>เส้นทางทั้งทริป</h1><p>{trip.title} · รถไฟ รถบัส เดิน Taxi และ Rental car ใน Timeline เดียว</p></div><Link className="btn btn-primary" href={`/trips/${id}/transport#add-transport`}>+ เพิ่มการเดินทาง</Link></section>
    <PlanHubTabs tripId={id} active="route" />

    <section className="route-summary-card">
      <div><span>เมือง/จุดหลัก</span><strong>{routeCities.length}</strong></div>
      <div><span>Transport</span><strong>{rows.length}</strong></div>
      <div><span>Rental car</span><strong>{carCount}</strong></div>
    </section>

    <section className="section">
      <div className="section-head"><h2>Route overview</h2><span className="small muted">อิง Transport Segments</span></div>
      <div className="city-route-strip">{routeCities.map((city: string, index: number) => <div className="city-route-node" key={`${city}-${index}`}><span>{index + 1}</span><strong>{city}</strong>{index < routeCities.length - 1 && <b>→</b>}</div>)}</div>
    </section>

    <section className="section">
      <div className="section-head"><h2>ช่วงการเดินทาง</h2><Link className="link" href={`/trips/${id}/transport`}>แก้ Transport ›</Link></div>
      {rows.length ? <div className="route-segment-list">{rows.map((segment: RouteSegment, index: number) => { const meta = modeMeta[segment.mode] || modeMeta.other; const dIndex = segment.day_id ? dayIndex.get(segment.day_id) : undefined; const isCar = segment.mode === "car"; return <article className={`route-segment-card ${isCar ? "rental" : ""}`} key={segment.id}>
        <div className="route-segment-order"><span>{meta.icon}</span><b>{index + 1}</b></div>
        <div className="route-segment-main">
          <div className="route-segment-meta">{dIndex != null ? `DAY ${dIndex + 1} · ` : ""}{meta.label}{segment.operator ? ` · ${segment.operator}` : ""}</div>
          <h3>{segment.origin} <span>→</span> {segment.destination}</h3>
          <div className="route-time-row"><strong>{segment.departure_time?.slice(0,5) || "—"}</strong><span>ถึง</span><strong>{segment.arrival_time?.slice(0,5) || "—"}</strong>{durationText(segment.departure_time, segment.arrival_time) && <em>ประมาณ {durationText(segment.departure_time, segment.arrival_time)}</em>}</div>
          {segment.service_name && <p>{isCar ? `รถ/คลาส: ${segment.service_name}` : segment.service_name}</p>}
          <div className="tag-row">{segment.reservation_required && <span className="mini-tag">Reservation</span>}{segment.booking_reference && <span className="mini-tag">Ref {segment.booking_reference}</span>}{segment.seat && <span className="mini-tag">{isCar ? `รายละเอียด ${segment.seat}` : `Seat ${segment.seat}`}</span>}</div>
          {segment.notes && <p className="small muted">{segment.notes}</p>}
          {isCar && <div className="rental-car-checklist"><strong>Rental car checklist</strong><span>ใบขับขี่/เอกสารที่ใช้ในญี่ปุ่น</span><span>ETC / ทางด่วน</span><span>Snow tire / chain เมื่อเข้าพื้นที่หิมะ</span><span>ที่จอดรถ + น้ำมัน + จุดคืนรถ</span></div>}
          <a className="btn btn-secondary route-map-button" href={directionsUrl(segment.origin, segment.destination, segment.mode)} target="_blank" rel="noreferrer">เปิดเส้นทางใน Google Maps</a>
        </div>
      </article>; })}</div> : <div className="empty-state"><div className="empty-icon">🛣️</div><h2>ยังไม่มี Transport Segment</h2><p>เพิ่มช่วง Nagoya → Takayama → Shirakawa-go หรือเพิ่ม Rental car ได้จากหน้า Transport</p><Link className="btn btn-primary" href={`/trips/${id}/transport#add-transport`}>เพิ่มการเดินทาง</Link></div>}
    </section>

    <section className="section rental-guide-card"><div className="section-head"><h2>🚙 เช่ารถในทริป</h2><span className="small muted">ใช้โหมด Rental car</span></div><p>บันทึกบริษัทเช่ารถเป็น Operator, รุ่น/คลาสรถเป็น Service, จุดรับรถเป็นต้นทาง และจุดคืนรถเป็นปลายทาง พร้อม Booking ref และหมายเหตุเรื่อง ETC / Snow tire / ที่จอดรถ</p><Link className="btn btn-primary btn-full" href={`/trips/${id}/transport#rental-car`}>เพิ่ม Rental car</Link></section>
  </div><BottomNav active="/plan" tripId={id} /></main>;
}
