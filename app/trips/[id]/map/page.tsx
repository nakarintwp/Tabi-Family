import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TripMapBoard, type TripMapPoint } from "@/components/TripMapBoard";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { japanDateKey } from "@/lib/v8";

function bookingMapsUrl(title: string, provider?: string | null) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider || title)}`; }

export default async function TripMapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  const { id } = await params; const query = await searchParams;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/map`);
  const [{ data: trip }, { data: transports }, { data: bookings }] = await Promise.all([
    supabase.from("trips").select("id,title,cities,trip_days(id,trip_date,title,activities(id,title,activity_type,location_name,maps_url,latitude,longitude,start_time,sort_order))").eq("id", id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time").eq("trip_id", id).order("sort_order"),
    supabase.from("bookings").select("id,booking_type,title,provider,start_at,confirmation_url").eq("trip_id", id).neq("booking_type", "document").order("start_at", { ascending: true, nullsFirst: false }),
  ]);
  if (!trip) notFound();
  const days = [...(trip.trip_days || [])].sort((a:any,b:any) => a.trip_date.localeCompare(b.trip_date));
  const selectedDay = days.find((day:any) => day.id === query.day) || days[0] || null;
  const activities = selectedDay ? [...(selectedDay.activities || [])].sort((a:any,b:any) => Number(a.sort_order||0)-Number(b.sort_order||0)) : [];
  const points: TripMapPoint[] = activities.filter((a:any) => Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude))).map((a:any) => ({ id:a.id,title:a.title,subtitle:a.location_name,latitude:Number(a.latitude),longitude:Number(a.longitude),kind:a.activity_type === "food" ? "food" : a.activity_type === "shopping" ? "shopping" : a.activity_type === "hotel" ? "hotel" : a.activity_type === "transport" ? "transport" : "attraction",mapsUrl:a.maps_url }));
  const dayTransports = selectedDay ? (transports || []).filter((segment:any) => segment.day_id === selectedDay.id) : [];
  const dayBookings = selectedDay ? (bookings || []).filter((booking:any) => japanDateKey(booking.start_at) === selectedDay.trip_date) : [];
  const mapSearchBase = activities[0]?.location_name || trip.cities?.[0] || "Japan";
  const utilityLinks = [
    ["🅿️ Parking", `parking near ${mapSearchBase}`],
    ["⛽ Gas station", `gas station near ${mapSearchBase}`],
    ["🚉 Station", `train station near ${mapSearchBase}`],
    ["🛣️ Rest area", `service area near ${mapSearchBase}`],
    ["🏪 Convenience", `convenience store near ${mapSearchBase}`],
  ];

  return <main className="shell"><div className="container"><AppHeader/>
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V10.3 Map-first Trip View</span></div>
    <section className="planner-hero map-first-hero"><div><span className="eyebrow">DAY ROUTE AT A GLANCE</span><h1>🗺️ Map-first Trip</h1><p>{trip.title} · เลือกวันแล้วดูสถานที่ + Transport + Booking รอบเดียว</p></div><Link className="btn btn-secondary" href={`/trips/${id}/optimize`}>Route Optimizer</Link></section>
    <div className="map-day-chips">{days.map((day:any,index:number) => <Link key={day.id} href={`/trips/${id}/map?day=${day.id}`} className={`filter-chip ${selectedDay?.id===day.id?"active":""}`}>Day {index+1}<small>{day.trip_date.slice(5)}</small></Link>)}</div>
    {selectedDay ? <>
      <section className="section map-first-main"><div className="section-head"><div><span className="eyebrow">{selectedDay.trip_date}</span><h2>{selectedDay.title || "Day route"}</h2></div><span className="small muted">{points.length} จุดมีพิกัด</span></div><TripMapBoard points={points}/></section>
      <section className="grid2 map-first-detail-grid"><article className="section"><div className="section-head"><h2>🚆 Transport</h2><Link className="link" href={`/trips/${id}/transport`}>จัดการ ›</Link></div>{dayTransports.length ? <div className="map-first-list">{dayTransports.map((segment:any) => <div key={segment.id}><span>{segment.departure_time?.slice(0,5)||"—"}</span><div><strong>{segment.origin} → {segment.destination}</strong><small>{segment.mode} · {[segment.operator,segment.service_name].filter(Boolean).join(" · ")}</small></div></div>)}</div> : <div className="empty-mini">วันนี้ยังไม่มี Transport segment</div>}</article>
      <article className="section"><div className="section-head"><h2>🎫 Booking วันนี้</h2><Link className="link" href={`/trips/${id}/bookings`}>Booking Center ›</Link></div>{dayBookings.length ? <div className="map-first-list">{dayBookings.map((booking:any) => <a key={booking.id} href={bookingMapsUrl(booking.title || booking.booking_type, booking.provider)} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{booking.title || booking.provider || booking.booking_type}</strong><small>{booking.provider || "เปิดค้นหาใน Google Maps"}</small></div></a>)}</div> : <div className="empty-mini">ไม่มี Booking ที่เริ่มวันนี้</div>}</article></section>
      <section className="section"><div className="section-head"><h2>สถานที่ตามลำดับ</h2><Link className="link" href={`/trips/${id}/days/${selectedDay.id}`}>Day Planner ›</Link></div><div className="map-first-route-strip">{activities.map((activity:any,index:number) => <div key={activity.id}><span>{index+1}</span><strong>{activity.start_time?.slice(0,5)||"—"} {activity.title}</strong><small>{activity.location_name || "ยังไม่มีชื่อสถานที่"}</small></div>)}</div></section>
      <section className="section"><div className="section-head"><h2>Map tools รอบจุดเริ่มวันนี้</h2><span className="small muted">Google Maps search · ไม่ใช้ API key</span></div><div className="map-utility-links">{utilityLinks.map(([label,search]) => <a key={label} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(search)}`} target="_blank" rel="noreferrer">{label} ↗</a>)}</div></section>
    </> : <div className="empty-state"><div className="empty-icon">🗺️</div><h2>ทริปยังไม่มีวันเดินทาง</h2></div>}
  </div><BottomNav active="/map"/></main>;
}
