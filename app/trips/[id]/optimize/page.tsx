import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { optimizeActivityRoute, routeDistanceKm, type OptimizableActivity } from "@/lib/v10";
import { applyOptimizedRoute } from "./actions";

function km(value: number) { return value < 10 ? value.toFixed(1) : Math.round(value).toString(); }

export default async function RouteOptimizerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/optimize`);
  const [{ data: trip }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title,activities(id,title,location_name,latitude,longitude,start_time,duration_minutes,sort_order,status))").eq("id", id).single(),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const days = [...(trip.trip_days || [])].sort((a: any, b: any) => a.trip_date.localeCompare(b.trip_date));

  return <main className="shell"><div className="container"><AppHeader/>
    <div className="planner-topbar"><Link href={`/trips/${id}/master-plan`} className="back-link">‹ Plan</Link><span className="planner-counter">V10.2 Smart Route Optimizer</span></div>
    <section className="planner-hero optimizer-hero"><div><span className="eyebrow">ZERO-COST ROUTE LOGIC</span><h1>🧭 Route Optimizer</h1><p>{trip.title} · เรียงสถานที่ที่มีพิกัดด้วย nearest-neighbor เพื่อช่วยลดการย้อนเส้นทาง</p></div><Link className="btn btn-secondary" href={`/trips/${id}/map`}>Map-first View</Link></section>
    <section className="section zero-cost-banner"><div className="zero-cost-icon">¥0</div><div><strong>เป็นระยะเส้นตรง ไม่ใช่เวลาขับรถจริง</strong><p>ใช้พิกัดที่บันทึกไว้เพื่อแนะนำลำดับเบื้องต้น กิจกรรมที่มีเวลาเริ่มต้นจะถูกใช้เป็น schedule anchor และรักษาลำดับเวลาไว้ จากนั้นควรเปิด Google Maps ตรวจเส้นทางจริง โดยเฉพาะภูเขา ทางด่วน และพื้นที่หิมะ</p></div></section>

    <div className="optimizer-day-list">{days.map((day: any, dayIndex: number) => {
      const current = [...(day.activities || [])].sort((a: any,b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0)) as OptimizableActivity[];
      const optimized = optimizeActivityRoute(current);
      const currentLocated = current.filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
      const optimizedLocated = optimized.filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
      const before = routeDistanceKm(currentLocated); const after = routeDistanceKm(optimizedLocated); const saving = Math.max(0, before - after);
      const changed = optimized.map((x) => x.id).join(",") !== current.map((x) => x.id).join(",");
      return <section className="section optimizer-day" key={day.id}>
        <div className="section-head"><div><span className="eyebrow">DAY {dayIndex + 1} · {day.trip_date}</span><h2>{day.title || `Day ${dayIndex + 1}`}</h2></div><div className="optimizer-metrics"><span><b>{km(before)} km</b> เดิม</span><span><b>{km(after)} km</b> แนะนำ</span>{saving > 0.2 && <span className="saving"><b>-{km(saving)} km</b> ลดการย้อน</span>}</div></div>
        {!current.length ? <div className="empty-mini">ยังไม่มีกิจกรรมในวันนี้</div> : <div className="route-compare-grid"><div><h3>ลำดับปัจจุบัน</h3><div className="optimizer-route-list">{current.map((item,index) => <div className="optimizer-route-row" key={item.id}><span>{index+1}</span><div><strong>{item.title}</strong><small>{item.start_time?.slice(0,5) || "เวลา —"}{Number.isFinite(Number(item.latitude)) ? " · มีพิกัด" : " · ไม่มีพิกัด"}</small></div></div>)}</div></div><div><h3>ลำดับแนะนำ</h3><div className="optimizer-route-list recommended">{optimized.map((item,index) => <div className="optimizer-route-row" key={item.id}><span>{index+1}</span><div><strong>{item.title}</strong><small>{index ? "จุดใกล้จากลำดับก่อนหน้า" : "จุดเริ่มต้น"}</small></div></div>)}</div></div></div>}
        {current.length > currentLocated.length && <p className="optimizer-note">ℹ️ {current.length-currentLocated.length} จุดไม่มีพิกัด ระบบคงไว้ท้ายลำดับ แนะนำเพิ่มจาก Explore/Day Planner เพื่อให้จัดเส้นทางได้แม่นขึ้น</p>}
        {canEdit && current.length > 1 && <form action={applyOptimizedRoute} className="optimizer-apply"><input type="hidden" name="trip_id" value={id}/><input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="ordered_ids" value={optimized.map((item) => item.id).join(",")}/><SubmitButton className="btn btn-primary" pendingText="กำลังเรียง..." disabled={!changed}>ใช้ลำดับแนะนำ</SubmitButton>{!changed && <small>ลำดับปัจจุบันใกล้เคียงคำแนะนำอยู่แล้ว</small>}</form>}
      </section>;
    })}</div>
  </div><BottomNav active="/plan" tripId={id} /></main>;
}
