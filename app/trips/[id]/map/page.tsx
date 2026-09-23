import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaceScore } from "@/components/PaceScore";
import { TripMap } from "@/components/TripMap";
import { calculatePaceScore, googleMapsDirectionsUrl } from "@/lib/trip-metrics";
import { createClient } from "@/lib/supabase/server";

export default async function TripMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/trips/${id}/map`);

  const { data: trip } = await supabase
    .from("trips")
    .select(`id,title,cities,trip_members(id,member_type,walking_level,avoid_stairs,needs_frequent_rest),trip_days(id,trip_date,title,activities(id,title,location_name,latitude,longitude,start_time,child_friendly,senior_friendly,sort_order))`)
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const days = [...(trip.trip_days || [])].sort((a,b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const allPoints = days.flatMap((day, dayIndex) => [...(day.activities || [])]
    .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0))
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({ id: a.id, title: a.title, latitude: Number(a.latitude), longitude: Number(a.longitude), label: `Day ${dayIndex + 1} · ${a.start_time?.slice(0,5) || "เวลาอิสระ"}` })));

  return (
    <main className="shell">
      <div className="container day-planner-container">
        <AppHeader />
        <div className="planner-topbar"><Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">V3 Trip Map</span></div>
        <section className="planner-hero map-hero"><div><div className="eyebrow">Trip map</div><h1>แผนที่ทั้งทริป</h1><p>{trip.title} · {trip.cities?.join(" • ")}</p></div><span className="planner-count-badge">📍 {allPoints.length} จุด</span></section>

        <TripMap apiKey={apiKey} points={allPoints} />

        <section className="section">
          <div className="section-head"><h2>รายวัน</h2><span className="small muted">เส้นทางเป็นการประมาณจากพิกัด</span></div>
          <div className="map-day-list">
            {days.map((day, index) => {
              const activities = [...(day.activities || [])].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
              const metrics = calculatePaceScore(activities, trip.trip_members || []);
              const routeUrl = googleMapsDirectionsUrl(activities);
              const mapped = activities.filter((a) => a.latitude != null && a.longitude != null).length;
              return <article className="card map-day-card" key={day.id}>
                <div className="map-day-head"><div><strong>Day {index + 1} · {day.title || ""}</strong><small>{day.trip_date}</small></div><span className={`pace-mini pace-${metrics.tone}`}>{metrics.score}</span></div>
                <div className="map-day-stats"><span>📍 {mapped}/{activities.length} พิกัด</span><span>↔ ~{metrics.distanceKm.toFixed(1)} กม.</span><span>⚡ {metrics.label}</span></div>
                <div className="map-day-actions"><Link href={`/trips/${trip.id}/days/${day.id}`} className="link">เปิด Day Planner</Link>{routeUrl && <a href={routeUrl} target="_blank" rel="noreferrer" className="link">เปิดเส้นทาง Google Maps ↗</a>}</div>
              </article>;
            })}
          </div>
        </section>

        {days[0] && (() => {
          const firstActivities = [...(days[0].activities || [])].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
          const firstMetrics = calculatePaceScore(firstActivities, trip.trip_members || []);
          return <section className="section"><div className="section-head"><h2>ตัวอย่าง Pace Score</h2><span className="small muted">Day 1</span></div><PaceScore {...firstMetrics} /></section>;
        })()}
      </div>
      <BottomNav active="/map" />
    </main>
  );
}
