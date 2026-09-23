import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function fullDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

const modeIcon: Record<string, string> = { train: "🚆", bus: "🚌", flight: "✈️", car: "🚗", taxi: "🚕", ferry: "⛴️", walk: "🚶", other: "➡️" };

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/calendar`);
  const [{ data: trip }, { data: transports }] = await Promise.all([
    supabase.from("trips").select("id,title,start_date,end_date,cities,trip_days(id,trip_date,title,notes,activities(id,title,start_time,activity_type,sort_order,status))").eq("id", id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,origin,destination,departure_time,arrival_time,service_name").eq("trip_id", id).order("sort_order"),
  ]);
  if (!trip) notFound();
  const days = [...(trip.trip_days || [])].sort((a,b) => a.trip_date.localeCompare(b.trip_date));
  const transportByDay = new Map<string, typeof transports>();
  for (const segment of transports || []) {
    if (!segment.day_id) continue;
    const current = transportByDay.get(segment.day_id) || [];
    current.push(segment);
    transportByDay.set(segment.day_id, current);
  }

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">Calendar</span></div>
    <section className="planner-hero calendar-hero"><div><span className="eyebrow">TRIP OVERVIEW</span><h1>🗓 Calendar Overview</h1><p>{trip.title}</p></div><Link className="btn btn-secondary" href={`/trips/${id}/transport`}>Transport</Link></section>

    <section className="calendar-overview">
      {days.map((day, index) => {
        const activities = [...(day.activities || [])].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
        const segments = transportByDay.get(day.id) || [];
        return <article className="calendar-day" key={day.id}>
          <div className="calendar-date"><span>DAY</span><strong>{index + 1}</strong><small>{fullDate(day.trip_date)}</small></div>
          <div className="calendar-day-body">
            <div className="calendar-day-head"><div><h2>{day.title || `Day ${index + 1}`}</h2>{day.notes && <p>{day.notes}</p>}</div><Link className="link" href={`/trips/${id}/days/${day.id}`}>เปิด Day ›</Link></div>
            {segments.map((segment) => <div className="calendar-transport" key={segment.id}><span>{modeIcon[segment.mode] || "➡️"}</span><div><strong>{segment.departure_time?.slice(0,5) || "—"} {segment.origin} → {segment.destination}</strong><small>{segment.service_name || segment.mode}</small></div></div>)}
            <div className="calendar-activities">
              {activities.length ? activities.map((activity) => <div className={`calendar-activity status-${activity.status || "planned"}`} key={activity.id}><time>{activity.start_time?.slice(0,5) || "—"}</time><span>{activity.title}</span></div>) : <div className="empty-mini">ยังไม่มีแผนในวันนี้</div>}
            </div>
          </div>
        </article>;
      })}
    </section>
  </div><BottomNav active="/plan" /></main>;
}
