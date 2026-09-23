import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getOptionalVerifiedUser } from "@/lib/supabase/auth";

export default async function PlanPage() {
  let trip: null | { id: string; title: string } = null;
  let days: Array<{ id: string; trip_date: string; title: string | null }> = [];
  let activities: Array<{ id: string; day_id: string; title: string; start_time: string | null; location_name: string | null; activity_type: string }> = [];

  if (hasSupabaseEnv()) {
    const { supabase, user } = await getOptionalVerifiedUser();
    const userId = user?.id;
    if (userId) {
      const { data } = await supabase.from("trips").select("id,title").order("start_date", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
      trip = data;
      if (trip) {
        const { data: dayRows } = await supabase.from("trip_days").select("id,trip_date,title").eq("trip_id", trip.id).order("trip_date");
        days = dayRows || [];
        const ids = days.map((d) => d.id);
        if (ids.length) {
          const { data: activityRows } = await supabase.from("activities").select("id,day_id,title,start_time,location_name,activity_type").in("day_id", ids).order("sort_order");
          activities = activityRows || [];
        }
      }
    }
  }

  return (
    <main className="shell"><div className="container"><AppHeader />
      <h1 className="page-title">แผนการเดินทาง</h1><p className="page-subtitle">{trip ? trip.title : "เข้าสู่ระบบและสร้างทริปเพื่อเริ่มวางแผนจริง"}</p>
      {!trip ? <div className="empty-state"><div className="empty-icon">📅</div><h2>ยังไม่มีแผน</h2><p>เมื่อสร้างทริป ระบบจะสร้างวันทั้งหมดให้ และคุณเพิ่มกิจกรรมได้ทันที</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div> :
      <div className="stack">{days.map((day, index) => {
        const rows = activities.filter((a) => a.day_id === day.id);
        return <section className="card" key={day.id}><div className="section-head"><h2>Day {index + 1}</h2><span className="small muted">{day.trip_date}</span></div>{rows.length ? <div className="timeline compact-timeline">{rows.map((activity) => <div className="timeline-item" key={activity.id}><span className="dot"/><div><div className="small muted">{activity.start_time?.slice(0,5) || "เวลาอิสระ"}</div><div className="activity-title">{activity.title}</div><div className="activity-meta">{activity.location_name || activity.activity_type}</div></div></div>)}</div> : <p className="small muted">ยังไม่มีกิจกรรม</p>}</section>;
      })}<Link className="btn btn-secondary btn-full" href={`/trips/${trip.id}`}>แก้ไขแผนและเพิ่มกิจกรรม</Link></div>}
    </div><BottomNav active="/plan" /></main>
  );
}
