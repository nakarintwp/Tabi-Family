import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { detectTripConflicts, type V8Day, type V8Transport } from "@/lib/v8";

export default async function ConflictsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/conflicts`);
  const [{ data: trip }, { data: transports }] = await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title,activities(id,title,activity_type,start_time,duration_minutes,location_name,status))").eq("id", id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id", id),
  ]);
  if (!trip) notFound();
  const days = (trip.trip_days || []) as V8Day[];
  const rows = (transports || []) as V8Transport[];
  const issues = detectTripConflicts(days, rows);
  const high = issues.filter((x) => x.level === "high").length;
  const medium = issues.filter((x) => x.level === "medium").length;

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/master-plan`} className="back-link">‹ Plan</Link><span className="planner-counter">V8.6 Conflict Detector</span></div>
    <section className="planner-hero v8-conflict-hero"><div><span className="eyebrow">RULE-BASED · ZERO API COST</span><h1>⚠️ Smart Conflict Detector</h1><p>{trip.title} · ตรวจเวลาชน buffer น้อย ตารางแน่น และ checklist รถเช่า</p></div><Link className="btn btn-secondary" href={`/trips/${id}/master-plan`}>Master Plan</Link></section>

    <section className="master-summary-grid"><div className="card dashboard-metric"><span>High</span><strong>{high}</strong><small>ควรแก้ก่อนเดินทาง</small></div><div className="card dashboard-metric"><span>Medium</span><strong>{medium}</strong><small>ควรตรวจสอบ</small></div><div className="card dashboard-metric"><span>Total</span><strong>{issues.length}</strong><small>ข้อสังเกตทั้งหมด</small></div></section>

    <section className="section"><div className="section-head"><h2>ผลการตรวจ</h2><span className="small muted">คำนวณจากข้อมูลใน Trip</span></div>
      {issues.length ? <div className="conflict-list">{issues.map((issue, index) => <article className={`conflict-card conflict-${issue.level}`} key={`${issue.title}-${index}`}><div className="conflict-severity">{issue.level === "high" ? "!" : issue.level === "medium" ? "⚠" : "i"}</div><div><span className="activity-label">{issue.level.toUpperCase()}{issue.dayDate ? ` · ${issue.dayDate}` : ""}</span><h3>{issue.title}</h3><p>{issue.detail}</p>{issue.dayId && <Link className="micro-link" href={`/trips/${id}/days/${issue.dayId}`}>เปิด Day Planner ›</Link>}</div></article>)}</div> : <div className="today-complete-card"><span>✅</span><div><strong>ไม่พบ conflict จากกฎพื้นฐาน</strong><p>แผนไม่มีเวลาทับซ้อนหรือ warning ที่ระบบตรวจพบในตอนนี้</p></div></div>}
    </section>
    <section className="card detector-rules"><strong>กฎที่ตรวจตอนนี้</strong><div className="tag-row"><span className="mini-tag">กิจกรรมเวลาทับ</span><span className="mini-tag">Buffer &lt; 20 นาที</span><span className="mini-tag">กิจกรรม 8+ จุด/วัน</span><span className="mini-tag">Transport ชนกิจกรรม</span><span className="mini-tag">Rental booking ref</span><span className="mini-tag">Winter tire note</span></div><p>ระบบนี้ไม่ดึงเวลาเปิดร้าน รถติด ตารางรถไฟ หรือสภาพถนนแบบ real-time จึงควรตรวจข้อมูลจริงก่อนเดินทาง</p></section>
  </div><BottomNav active="/plan" tripId={id} /></main>;
}
