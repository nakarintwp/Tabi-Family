"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CurrentLocationRoute, type RouteDestination } from "@/components/CurrentLocationRoute";
import { OfflineSnapshot } from "@/components/OfflineSnapshot";
import { mapsSearchUrl } from "@/lib/trip-metrics";
import { markActivityStatus, postponeActivity } from "@/app/today/actions";

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
  status?: "planned" | "done" | "skipped" | null;
  is_outdoor?: boolean | null;
  rain_alternative?: string | null;
};

type Day = {
  id: string;
  trip_date: string;
  title?: string | null;
  activities?: Activity[] | null;
};

type TransportSegment = {
  id: string;
  day_id?: string | null;
  mode: string;
  operator?: string | null;
  service_name?: string | null;
  origin: string;
  destination: string;
  departure_time?: string | null;
  arrival_time?: string | null;
  booking_reference?: string | null;
  seat?: string | null;
  notes?: string | null;
};

type Booking = {
  id: string;
  booking_type: string;
  title?: string | null;
  provider?: string | null;
  reference_code?: string | null;
  start_at?: string | null;
  confirmation_url?: string | null;
  notes?: string | null;
  details?: Record<string, unknown> | null;
};

type Trip = {
  id: string;
  title: string;
  cities?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  canEdit?: boolean;
  trip_days?: Day[] | null;
  transport_segments?: TransportSegment[] | null;
  bookings?: Booking[] | null;
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

function statusLabel(status?: string | null) {
  if (status === "done") return "เสร็จแล้ว";
  if (status === "skipped") return "ข้าม";
  return "รอทำ";
}

function japanDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function translateUrl(text: string) {
  return `https://translate.google.com/?sl=auto&tl=ja&text=${encodeURIComponent(text)}`;
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
        const planned = activities.filter((activity) => (activity.status || "planned") === "planned");
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let nextActivity = planned.find((activity) => activity.start_time && minutesOf(activity.start_time) >= currentMinutes) || null;
        if (!nextActivity) nextActivity = planned.find((activity) => !activity.start_time) || planned[0] || null;
        const doneCount = activities.filter((a) => a.status === "done").length;
        const skippedCount = activities.filter((a) => a.status === "skipped").length;
        return { kind: "today" as const, trip, day, dayIndex: index, days, activities, nextActivity, doneCount, skippedCount };
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
    return <div className="empty-state"><div className="empty-icon">☀️</div><h2>วันนี้ยังไม่มีแผนเดินทาง</h2><p>สร้างทริปหรือเพิ่มวันเดินทาง แล้ว Today Mode จะดึงแผนของวันปัจจุบันมาให้อัตโนมัติ</p><Link className="btn btn-primary" href="/trips">ดูทริปของฉัน</Link></div>;
  }

  if (model.kind === "upcoming") {
    const date = new Date(`${model.day.trip_date}T00:00:00`);
    return (
      <>
        <OfflineSnapshot data={{ tripTitle: model.trip.title, dayTitle: model.day.title, tripDate: model.day.trip_date, activities: model.day.activities || [] }} />
        <section className="today-hero upcoming"><span className="today-kicker">NEXT TRIP DAY</span><h1>{model.trip.title}</h1><p>{new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}</p><div className="today-day-pill">Day {model.dayIndex + 1} · {model.day.title || "แผนเดินทาง"}</div></section>
        <section className="section"><div className="card today-upcoming-card"><strong>ยังไม่ถึงวันเดินทาง</strong><p>เมื่อถึงวันที่กำหนด หน้า Today จะเปลี่ยนเป็น Timeline พร้อมสถานะ เสร็จแล้ว / ข้าม / เลื่อนไปทีหลัง และนำทางจากตำแหน่งมือถือ</p><Link className="btn btn-primary" href={`/trips/${model.trip.id}/days/${model.day.id}`}>เปิดแผนวันนี้ล่วงหน้า</Link></div></section>
      </>
    );
  }

  const { trip, day, dayIndex, activities, nextActivity, doneCount, skippedCount } = model;
  const todayTransports = (trip.transport_segments || []).filter((segment) => segment.day_id === day.id).sort((a, b) => String(a.departure_time || "99:99").localeCompare(String(b.departure_time || "99:99")));
  const todayBookings = (trip.bookings || []).filter((booking) => booking.booking_type !== "document" && japanDate(booking.start_at) === day.trip_date);
  const rentalToday = todayTransports.find((segment) => segment.mode === "car");
  const dateText = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long" }).format(now);
  const nextDestination: RouteDestination[] = nextActivity ? [{ id: nextActivity.id, title: nextActivity.title, locationName: nextActivity.location_name, latitude: nextActivity.latitude, longitude: nextActivity.longitude }] : [];
  const progress = activities.length ? Math.round(((doneCount + skippedCount) / activities.length) * 100) : 0;
  const snapshotActivities = activities.map((a) => ({ ...a, maps_url: mapsSearchUrl(a.location_name, a.maps_url) }));

  return (
    <>
      <OfflineSnapshot data={{ tripTitle: trip.title, dayTitle: day.title || `Day ${dayIndex + 1}`, tripDate: day.trip_date, activities: snapshotActivities }} />
      <section className="today-hero"><div><span className="today-kicker">TODAY · {now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span><h1>{day.title || `Day ${dayIndex + 1}`}</h1><p>{dateText} · {trip.title}</p></div><div className="today-day-pill">Day {dayIndex + 1}</div></section>

      <section className="section today-progress-card">
        <div className="section-head"><h2>ความคืบหน้าวันนี้</h2><strong>{doneCount}/{activities.length}</strong></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <small className="muted">เสร็จแล้ว {doneCount} · ข้าม {skippedCount} · เหลือ {Math.max(0, activities.length - doneCount - skippedCount)}</small>
      </section>

      <section className="section today-command-center">
        <div className="section-head"><h2>Today Command Center</h2><span className="badge success">V8.4</span></div>
        <div className="today-command-grid">
          <Link className="today-command-card" href={`/trips/${trip.id}/bookings`}><span>🎫</span><div><strong>{todayBookings.length} Booking</strong><small>เปิดเลขจอง / confirmation</small></div></Link>
          <Link className="today-command-card" href={`/trips/${trip.id}/route`}><span>🚆</span><div><strong>{todayTransports.length} Transport</strong><small>{todayTransports[0] ? `${todayTransports[0].origin} → ${todayTransports[0].destination}` : "ยังไม่มีช่วงเดินทาง"}</small></div></Link>
          <Link className="today-command-card" href={`/trips/${trip.id}/documents`}><span>📂</span><div><strong>Documents</strong><small>Voucher · Insurance · Ticket</small></div></Link>
          <Link className="today-command-card emergency" href={`/trips/${trip.id}/emergency`}><span>🆘</span><div><strong>Emergency</strong><small>110 · 119 · JNTO</small></div></Link>
          {rentalToday && <Link className="today-command-card rental" href={`/trips/${trip.id}/rental-car`}><span>🚙</span><div><strong>Rental car วันนี้</strong><small>{rentalToday.origin} → {rentalToday.destination}</small></div></Link>}
        </div>
      </section>

      {nextActivity ? (
        <section className="section today-next-section">
          <div className="section-head"><h2>ต่อไป</h2><span className="badge success">NEXT</span></div>
          <div className="today-next-card">
            <div className="today-next-time">{nextActivity.start_time?.slice(0, 5) || "ตอนนี้"}</div>
            <div className="today-next-copy"><span>{activityIcon(nextActivity.activity_type)}</span><div><h3>{nextActivity.title}</h3>{nextActivity.location_name && <p>📍 {nextActivity.location_name}</p>}{nextActivity.is_outdoor && <span className="weather-sensitive-badge">☁️ Outdoor</span>}{nextActivity.notes && <small>{nextActivity.notes}</small>}</div></div>
          </div>
          <CurrentLocationRoute destinations={nextDestination} compact title="นำทางไปจุดถัดไป" />
          <div className="today-action-row today-primary-actions">
            {todayBookings[0]?.confirmation_url && <a className="btn btn-secondary btn-small" href={todayBookings[0].confirmation_url} target="_blank" rel="noreferrer">🎫 Booking</a>}
            <a className="btn btn-secondary btn-small" href={translateUrl(`${nextActivity.title}${nextActivity.location_name ? ` at ${nextActivity.location_name}` : ""}`)} target="_blank" rel="noreferrer">文 Translate</a>
            {trip.canEdit && <><form action={markActivityStatus}><input type="hidden" name="trip_id" value={trip.id}/><input type="hidden" name="activity_id" value={nextActivity.id}/><input type="hidden" name="status" value="done"/><button className="btn btn-primary btn-small">✓ เสร็จแล้ว</button></form>
            <form action={postponeActivity}><input type="hidden" name="trip_id" value={trip.id}/><input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="activity_id" value={nextActivity.id}/><button className="btn btn-secondary btn-small">↷ ไว้ทีหลัง</button></form>
            <form action={markActivityStatus}><input type="hidden" name="trip_id" value={trip.id}/><input type="hidden" name="activity_id" value={nextActivity.id}/><input type="hidden" name="status" value="skipped"/><button className="btn btn-secondary btn-small">ข้าม</button></form></>}
          </div>
        </section>
      ) : (
        <section className="section"><div className="today-complete-card"><span>🎉</span><div><strong>กิจกรรมวันนี้ครบแล้ว</strong><p>ตรวจแผนวันพรุ่งนี้ หรือกลับรายการที่ข้ามเป็น “รอทำ” ได้ด้านล่าง</p></div></div></section>
      )}

      <section className="section">
        <div className="section-head"><h2>Timeline วันนี้</h2><Link className="link" href={`/trips/${trip.id}/days/${day.id}`}>เปิด Day Planner ›</Link></div>
        {activities.length ? <div className="today-timeline">
          {activities.map((activity) => {
            const status = activity.status || "planned";
            const active = nextActivity?.id === activity.id;
            const mapUrl = mapsSearchUrl(activity.location_name, activity.maps_url);
            return <article className={`today-activity status-${status} ${active ? "active" : ""}`} key={activity.id}>
              <div className="today-time">{activity.start_time?.slice(0,5) || "—"}</div>
              <div className="today-dot">{status === "done" ? "✓" : status === "skipped" ? "–" : active ? "●" : "○"}</div>
              <div className="today-activity-copy"><div className="today-activity-head"><strong>{activityIcon(activity.activity_type)} {activity.title}</strong><span className={`mini-status ${status}`}>{statusLabel(status)}</span></div>{activity.location_name && <small>{activity.location_name}</small>}{activity.rain_alternative && <small>☔ สำรอง: {activity.rain_alternative}</small>}{mapUrl && <a target="_blank" rel="noreferrer" href={mapUrl}>ดูสถานที่ ↗</a>}
              {trip.canEdit && status !== "planned" && <form action={markActivityStatus} className="inline-reset-form"><input type="hidden" name="trip_id" value={trip.id}/><input type="hidden" name="activity_id" value={activity.id}/><input type="hidden" name="status" value="planned"/><button className="text-button">↺ กลับเป็นรอทำ</button></form>}
              </div>
            </article>;
          })}
        </div> : <div className="empty-mini">วันนี้ยังไม่มีกิจกรรม <Link href={`/trips/${trip.id}/days/${day.id}`}>เพิ่มกิจกรรม</Link></div>}
      </section>
    </>
  );
}
