import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaceScore } from "@/components/PaceScore";
import { CurrentLocationRoute } from "@/components/CurrentLocationRoute";
import { calculatePaceScore, mapsSearchUrl } from "@/lib/trip-metrics";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export default async function TripMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/map`);

  const { data: trip } = await supabase
    .from("trips")
    .select(`id,title,cities,pace,trip_members(id,member_type,walking_level,avoid_stairs,needs_frequent_rest),trip_days(id,trip_date,title,activities(id,title,location_name,maps_url,latitude,longitude,start_time,duration_minutes,child_friendly,senior_friendly,sort_order))`)
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const days = [...(trip.trip_days || [])].sort((a,b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const totalLocations = days.reduce((sum, day) => sum + (day.activities || []).filter((item) => item.location_name).length, 0);

  return (
    <main className="shell">
      <div className="container day-planner-container">
        <AppHeader />
        <div className="planner-topbar"><Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V4.1 Route · ¥0 API</span></div>
        <section className="planner-hero map-hero"><div><div className="eyebrow">Zero-cost map links</div><h1>🗺️ แผนที่ทั้งทริป</h1><p>{trip.title} · {trip.cities?.join(" • ")}</p></div><span className="planner-count-badge">📍 {totalLocations} จุด</span></section>

        <section className="section zero-cost-banner"><div className="zero-cost-icon">¥0</div><div><strong>ไม่ใช้ Google Maps API</strong><p>Tabi Family สร้างลิงก์ค้นหาและเส้นทาง แล้วเปิดใน Google Maps โดยตรง จึงไม่ต้องตั้ง Billing/API key</p></div></section>

        <section className="section">
          <div className="section-head"><h2>เส้นทางรายวัน</h2><span className="small muted">อิงลำดับใน Day Planner</span></div>
          <div className="map-day-list">
            {days.map((day, index) => {
              const activities = [...(day.activities || [])].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
              const metrics = calculatePaceScore(activities, trip.trip_members || [], trip.pace);
              const locations = activities.filter((a) => a.location_name || (Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude))));
              const routeDestinations = locations.map((activity) => ({ id: activity.id, title: activity.title, locationName: activity.location_name, latitude: activity.latitude, longitude: activity.longitude }));
              return <article className="card map-day-card" key={day.id}>
                <div className="map-day-head"><div><strong>Day {index + 1} · {day.title || ""}</strong><small>{day.trip_date}</small></div><span className={`pace-mini pace-${metrics.tone}`}>{metrics.score}</span></div>
                <div className="map-day-stats"><span>📍 {locations.length} สถานที่</span><span>⏱ ~{Math.round(metrics.totalMinutes / 60)} ชม.</span><span>⚡ {metrics.label}</span></div>
                {locations.length > 0 && <div className="map-link-list">
                  {locations.slice(0, 6).map((activity, activityIndex) => {
                    const url = mapsSearchUrl(activity.location_name, activity.maps_url);
                    return <div className="map-link-row" key={activity.id}><span>{activityIndex + 1}</span><div><strong>{activity.title}</strong><small>{activity.location_name}</small></div>{url && <a href={url} target="_blank" rel="noreferrer">Maps ↗</a>}</div>;
                  })}
                  {locations.length > 6 && <small className="muted">+ อีก {locations.length - 6} จุด</small>}
                </div>}
                <div className="map-day-actions"><Link href={`/trips/${trip.id}/days/${day.id}`} className="link">เปิด Day Planner</Link></div>
                {routeDestinations.length > 0 && <CurrentLocationRoute destinations={routeDestinations} compact title={`Route Map · Day ${index + 1}`} />}
              </article>;
            })}
          </div>
        </section>

        {days[0] && (() => {
          const firstActivities = [...(days[0].activities || [])].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
          const firstMetrics = calculatePaceScore(firstActivities, trip.trip_members || [], trip.pace);
          return <section className="section"><div className="section-head"><h2>Family Smart Pace</h2><span className="small muted">Day 1</span></div><PaceScore {...firstMetrics} /></section>;
        })()}
      </div>
      <BottomNav active="/map" />
    </main>
  );
}
