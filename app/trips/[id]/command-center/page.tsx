import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { calculateReadiness } from "@/lib/trip-readiness";
import { buildSmartAlerts, buildUnifiedTimeline, alertWeight, type V9Booking } from "@/lib/v9";
import { japanDateKey, type V8Day, type V8Transport } from "@/lib/v8";

export default async function CommandCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/command-center`);
  const [{ data: trip }, { data: transports }, { data: bookings }, { data: expenses }, { count: documentCount }, { count: packingCount }, { count: packedCount }] = await Promise.all([
    supabase.from("trips").select("id,title,start_date,end_date,cities,budget,currency,trip_days(id,trip_date,title,activities(id,title,activity_type,start_time,duration_minutes,location_name,sort_order,status)),trip_members(id,name,age,passport_expiry,child_seat)").eq("id", id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id", id).order("sort_order"),
    supabase.from("bookings").select("id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes,details").eq("trip_id", id).order("start_at", { ascending: true, nullsFirst: false }),
    supabase.from("expenses").select("amount,currency,category,paid_at").eq("trip_id", id),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("trip_id", id).eq("booking_type", "document"),
    supabase.from("packing_items").select("id", { count: "exact", head: true }).eq("trip_id", id),
    supabase.from("packing_items").select("id", { count: "exact", head: true }).eq("trip_id", id).eq("is_packed", true),
  ]);
  if (!trip) notFound();

  const days = ([...(trip.trip_days || [])] as V8Day[]).sort((a,b)=>a.trip_date.localeCompare(b.trip_date));
  const transportRows = (transports || []) as V8Transport[];
  const bookingRows = (bookings || []) as V9Booking[];
  const timeline = buildUnifiedTimeline(days, transportRows, bookingRows, id);
  const today = japanDateKey(new Date().toISOString()) || "";
  const nextItems = timeline.filter((item)=>item.date >= today).slice(0,5);
  const alerts = buildSmartAlerts({ tripId:id, bookings:bookingRows, transports:transportRows, documentCount:documentCount || 0, members:trip.trip_members || [], tripEnd:trip.end_date }).sort((a,b)=>alertWeight(b.level)-alertWeight(a.level));
  const plannedDays = days.filter((d)=>Boolean(d.activities?.length)).length;
  const readiness = calculateReadiness({ startDate:trip.start_date,endDate:trip.end_date,cities:trip.cities,membersCount:trip.trip_members?.length || 0,daysCount:days.length,plannedDays,bookings:bookingRows,packingCount:packingCount || 0,packedCount:packedCount || 0,transportCount:transportRows.length });
  const spentJPY = (expenses || []).filter((e:any)=>e.currency==="JPY").reduce((s:number,e:any)=>s+Number(e.amount||0),0);
  const spentTHB = (expenses || []).filter((e:any)=>e.currency==="THB").reduce((s:number,e:any)=>s+Number(e.amount||0),0);
  const carSegments = transportRows.filter((x)=>x.mode==="car").length;

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V9.0 Smart Dashboard</span></div>
    <section className="planner-hero command-hero"><div><span className="eyebrow">TRIP COMMAND CENTER</span><h1>🧭 {trip.title}</h1><p>{trip.cities?.join(" → ") || "Japan"} · ทุกอย่างสำคัญของทริปในหน้าเดียว</p></div><div className="master-hero-actions"><Link className="btn btn-primary" href="/today">Today</Link><Link className="btn btn-secondary" href={`/trips/${id}/timeline`}>Timeline</Link></div></section>

    <section className="command-metrics">
      <Link href={`/trips/${id}/readiness`} className="card command-metric"><span>ความพร้อม</span><strong>{readiness.score}%</strong><small>{readiness.items?.filter((x:any)=>!x.done).length || 0} รายการควรตรวจ</small></Link>
      <Link href={`/trips/${id}/notifications`} className="card command-metric"><span>Smart Alerts</span><strong>{alerts.length}</strong><small>{alerts.filter((a)=>a.level==="high").length} สำคัญ</small></Link>
      <Link href={`/trips/${id}/bookings`} className="card command-metric"><span>Booking</span><strong>{bookingRows.filter((b)=>b.booking_type!=="document").length}</strong><small>เอกสาร {documentCount || 0}</small></Link>
      <Link href={`/trips/${id}/driving`} className="card command-metric"><span>Rental car</span><strong>{carSegments}</strong><small>{carSegments ? "มีช่วงขับรถ" : "ไม่มีช่วงรถเช่า"}</small></Link>
    </section>

    <section className="grid2 command-grid">
      <article className="section command-panel"><div className="section-head"><h2>ถัดไปใน Timeline</h2><Link className="link" href={`/trips/${id}/timeline`}>ดูทั้งหมด ›</Link></div>{nextItems.length ? <div className="command-next-list">{nextItems.map((item)=><Link href={item.href || "#"} className="command-next-row" key={item.id}><time><b>{item.date.slice(5)}</b><span>{item.time || "—"}</span></time><span className="command-next-icon">{item.icon}</span><div><strong>{item.title}</strong>{item.subtitle && <small>{item.subtitle}</small>}</div></Link>)}</div> : <div className="empty-mini">ไม่มีรายการถัดไปใน Timeline</div>}</article>
      <article className="section command-panel"><div className="section-head"><h2>รายการที่ควรตรวจ</h2><Link className="link" href={`/trips/${id}/notifications`}>Smart Alerts ›</Link></div>{alerts.length ? <div className="alert-mini-list">{alerts.slice(0,5).map((alert,index)=><Link href={alert.href || "#"} className={`alert-mini-row ${alert.level}`} key={`${alert.title}-${index}`}><span>{alert.level==="high"?"!":alert.level==="medium"?"⚠":"i"}</span><div><strong>{alert.title}</strong><small>{alert.detail}</small></div></Link>)}</div> : <div className="success-box">ไม่มี Smart Alert สำคัญจากข้อมูลที่บันทึกไว้ ✓</div>}</article>
    </section>

    <section className="section"><div className="section-head"><h2>Control shortcuts</h2></div><div className="quick-actions v9-shortcuts">
      <Link className="quick-action" href={`/trips/${id}/timeline`}><span>🕒</span><strong>Timeline</strong><small>V9.1 รวมทุกเวลา</small></Link>
      <Link className="quick-action" href={`/trips/${id}/notifications`}><span>🔔</span><strong>Notifications</strong><small>V9.2 สิ่งที่ควรตรวจ</small></Link>
      <Link className="quick-action" href={`/trips/${id}/offline-pack`}><span>📴</span><strong>Offline Pack</strong><small>V9.3 เก็บข้อมูลสำคัญ</small></Link>
      <Link className="quick-action" href={`/trips/${id}/family`}><span>👨‍👩‍👧</span><strong>Family Profiles</strong><small>V9.4 Child seat · Passport</small></Link>
      <Link className="quick-action" href={`/trips/${id}/route-cost`}><span>🧮</span><strong>Route Cost</strong><small>V9.5 เปรียบเทียบค่าเดินทาง</small></Link>
      <Link className="quick-action" href={`/trips/${id}/driving`}><span>🚙</span><strong>Driving</strong><small>V9.6 Japan Driving Assistant</small></Link>
      <Link className="quick-action" href={`/explore?trip=${id}`}><span>✨</span><strong>Explore</strong><small>V9.7 Place Intelligence</small></Link>
      <Link className="quick-action" href={`/trips/${id}/documents`}><span>📂</span><strong>Documents</strong><small>Auto-linked</small></Link>
    </div></section>

    <section className="section"><div className="section-head"><h2>Money snapshot</h2><Link className="link" href={`/trips/${id}/budget`}>Budget ›</Link></div><div className="grid2"><div className="card metric"><span>JPY spent</span><strong>¥{spentJPY.toLocaleString("en-US")}</strong></div><div className="card metric"><span>THB spent</span><strong>฿{spentTHB.toLocaleString("th-TH")}</strong></div></div></section>
  </div><BottomNav active="/trips" /></main>;
}
