"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CurrentLocationRoute, type RouteDestination } from "@/components/CurrentLocationRoute";
import { mapsSearchUrl } from "@/lib/trip-metrics";

type Activity = {
  id: string;
  title: string;
  activity_type?: string | null;
  start_time?: string | null;
  duration_minutes?: number | null;
  location_name?: string | null;
  maps_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  sort_order?: number | null;
};

type Day = {
  id: string;
  trip_date: string;
  title?: string | null;
  activities?: Activity[] | null;
};

type Trip = {
  id: string;
  title: string;
  cities?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  trip_days?: Day[] | null;
};

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function minutesOf(time?: string | null) {
  if (!time) return Number.POSITIVE_INFINITY;
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function activityIcon(type?: string | null) {
  if (type === "food") return "🍜";
  if (type === "transport") return "🚆";
  if (type === "shopping") return "🛍️";
  if (type === "hotel") return "🏨";
  return "📍";
}

export function TodayMode({ trips }: { trips: Trip[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const model = useMemo(() => {
    if (!now) return null;
    const today = localDateKey(now);
    for (const trip of trips) {
      const days = [...(trip.trip_days || [])].sort((a, b) => a.trip_date.localeCompare(b.trip_date));
      const index = days.findIndex((day) => day.trip_date === today);
      if (index >= 0) {
        const day = days[index];
        const activities = [...(day.activities || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || minutesOf(a.start_time) - minutesOf(b.start_time));
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextIndex = activities.findIndex((activity) => activity.start_time && minutesOf(activity.start_time) >= currentMinutes);
        return { kind: "today" as const, trip, day, dayIndex: index, days, activities, nextActivity: nextIndex >= 0 ? activities[nextIndex] : null, nextIndex };
      }
    }

    const future: Array<{ trip: Trip; day: Day; dayIndex: number; days: Day[] }> = [];
    trips.forEach((trip) => {
      const days = [...(trip.trip_days || [])].sort((a, b) => a.trip_date.localeCompare(b.trip_date));
      days.forEach((day, dayIndex) => { if (day.trip_date > today) future.push({ trip, day, dayIndex, days }); });
    });
    future.sort((a, b) => a.day.trip_date.localeCompare(b.day.trip_date));
    if (future[0]) return { kind: "upcoming" as const, ...future[0] };
    return { kind: "none" as const };
  }, [now, trips]);

  if (!now || !model) return <div className="today-loading">กำลังเตรียม Today Mode...</div>;

  if (model.kind === "none") {
    return <div className="empty-state"><div className="empty-icon">☀️</div><h2>วันนี้ยังไม่มีแผนเดินทาง</h2><p>สร้างทริปหรือเพิ่มวันเดินทาง แล้ว Today Mode จะดึงแผนของวันปัจจุบันมาให้โดยอัตโนมัติ</p><Link className="btn btn-primary" href="/trips">ดูทริปของฉัน</Link></div>;
  }

  if (model.kind === "upcoming") {
    const date = new Date(`${model.day.trip_date}T00:00:00`);
    return (
      <>
        <section className="today-hero upcoming"><span className="today-kicker">NEXT TRIP DAY</span><h1>{model.trip.title}</h1><p>{new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}</p><div className="today-day-pill">Day {model.dayIndex + 1} · {model.day.title || "แผนเดินทาง"}</div></section>
        <section className="section"><div className="card today-upcoming-card"><strong>ยังไม่ถึงวันเดินทาง</strong><p>เมื่อถึงวันที่กำหนด หน้า Today จะเปลี่ยนเป็น Timeline ของวันนั้นและเปิดนำทางจากตำแหน่งมือถือได้ทันที</p><Link className="btn btn-primary" href={`/trips/${model.trip.id}/days/${model.day.id}`}>เปิดแผนวันนี้ล่วงหน้า</Link></div></section>
      </>
    );
  }

  const { trip, day, dayIndex, activities, nextActivity, nextIndex } = model;
  const dateText = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long" }).format(now);
  const nextDestination: RouteDestination[] = nextActivity ? [{ id: nextActivity.id, title: nextActivity.title, locationName: nextActivity.location_name, latitude: nextActivity.latitude, longitude: nextActivity.longitude }] : [];

  return (
    <>
      <section className="today-hero"><div><span className="today-kicker">TODAY · {now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span><h1>{day.title || `Day ${dayIndex + 1}`}</h1><p>{dateText} · {trip.title}</p></div><div className="today-day-pill">Day {dayIndex + 1}</div></section>

      {nextActivity ? (
        <section className="section today-next-section">
          <div className="section-head"><h2>ต่อไป</h2><span className="badge success">NEXT</span></div>
          <div className="today-next-card">
            <div className="today-next-time">{nextActivity.start_time?.slice(0, 5) || "ตอนนี้"}</div>
            <div className="today-next-copy"><span>{activityIcon(nextActivity.activity_type)}</span><div><h3>{nextActivity.title}</h3>{nextActivity.location_name && <p>📍 {nextActivity.location_name}</p>}{nextActivity.notes && <small>{nextActivity.notes}</small>}</div></div>
          </div>
          <CurrentLocationRoute destinations={nextDestination} compact title="นำทางไปจุดถัดไป" />
        </section>
      ) : (
        <section className="section"><div className="today-complete-card"><span>🎉</span><div><strong>กิจกรรมวันนี้ครบแล้ว</strong><p>ตรวจแผนวันพรุ่งนี้หรือเพิ่มกิจกรรมเพิ่มเติมได้จาก Day Planner</p></div></div></section>
      )}

      <section className="section">
        <div className="section-head"><h2>Timeline วันนี้</h2><Link className="link" href={`/trips/${trip.id}/days/${day.id}`}>แก้ไข ›</Link></div>
        {activities.length ? <div className="today-timeline">
          {activities.map((activity, index) => {
            const passed = nextIndex >= 0 ? index < nextIndex : true;
            const active = nextIndex === index;
            const mapUrl = mapsSearchUrl(activity.location_name, activity.maps_url);
            return <article className={`today-activity ${passed ? "passed" : ""} ${active ? "active" : ""}`} key={activity.id}>
              <div className="today-time">{activity.start_time?.slice(0,5) || "—"}</div>
              <div className="today-dot">{active ? "●" : passed ? "✓" : "○"}</div>
              <div className="today-activity-copy"><strong>{activityIcon(activity.activity_type)} {activity.title}</strong>{activity.location_name && <small>{activity.location_name}</small>}{mapUrl && <a target="_blank" rel="noreferrer" href={mapUrl}>ดูสถานที่ ↗</a>}</div>
            </article>;
          })}
        </div> : <div className="empty-mini">วันนี้ยังไม่มีกิจกรรม <Link href={`/trips/${trip.id}/days/${day.id}`}>เพิ่มกิจกรรม</Link></div>}
      </section>
    </>
  );
}
