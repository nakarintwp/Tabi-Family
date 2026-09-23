import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaceScore } from "@/components/PaceScore";
import { PlacePicker } from "@/components/PlacePicker";
import { SubmitButton } from "@/components/SubmitButton";
import { TripMap } from "@/components/TripMap";
import { calculatePaceScore, googleMapsDirectionsUrl } from "@/lib/trip-metrics";
import { createClient } from "@/lib/supabase/server";
import { addActivity, deleteActivity, updateActivity, updateDay } from "./actions";

function longDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function typeMeta(type: string) {
  if (type === "food") return { icon: "🍜", label: "อาหาร" };
  if (type === "transport") return { icon: "🚆", label: "การเดินทาง" };
  if (type === "shopping") return { icon: "🛍️", label: "ช้อปปิ้ง" };
  if (type === "hotel") return { icon: "🏨", label: "โรงแรม" };
  return { icon: "📍", label: "สถานที่เที่ยว" };
}

export default async function DayPlannerPage({ params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/trips/${id}/days/${dayId}`);

  const [{ data: trip }, { data: day }] = await Promise.all([
    supabase.from("trips").select("id,title,cities,pace,trip_members(id,member_type,walking_level,avoid_stairs,needs_frequent_rest),trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.from("trip_days").select("id,trip_id,trip_date,title,notes,activities(id,title,activity_type,start_time,duration_minutes,location_name,latitude,longitude,notes,child_friendly,senior_friendly,sort_order)").eq("id", dayId).eq("trip_id", id).single(),
  ]);

  if (!trip || !day) notFound();

  const days = [...(trip.trip_days || [])].sort((a, b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const dayIndex = days.findIndex((item) => item.id === day.id);
  const previousDay = dayIndex > 0 ? days[dayIndex - 1] : null;
  const nextDay = dayIndex >= 0 && dayIndex < days.length - 1 ? days[dayIndex + 1] : null;
  const activities = [...(day.activities || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const metrics = calculatePaceScore(activities, trip.trip_members || []);
  const routeUrl = googleMapsDirectionsUrl(activities);
  const mapPoints = activities
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({ id: a.id, title: a.title, latitude: Number(a.latitude), longitude: Number(a.longitude), label: a.start_time?.slice(0,5) || "เวลาอิสระ" }));

  return (
    <main className="shell">
      <div className="container day-planner-container">
        <AppHeader />

        <div className="planner-topbar">
          <Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link>
          <span className="planner-counter">Day {dayIndex + 1} / {days.length}</span>
        </div>

        <section className="planner-hero">
          <div><div className="eyebrow">Day planner · V3</div><h1>{day.title || `Day ${dayIndex + 1}`}</h1><p>{longDate(day.trip_date)}</p></div>
          <span className="planner-count-badge">{activities.length} จุด</span>
        </section>

        <div className="day-switcher">
          {previousDay ? <Link href={`/trips/${trip.id}/days/${previousDay.id}`} className="day-switch-button">← Day {dayIndex}</Link> : <span />}
          {nextDay ? <Link href={`/trips/${trip.id}/days/${nextDay.id}`} className="day-switch-button">Day {dayIndex + 2} →</Link> : <span />}
        </div>

        <section className="section pace-section">
          <PaceScore {...metrics} />
        </section>

        <section className="section planner-map-section">
          <div className="section-head"><h2>Route Map</h2>{routeUrl ? <a className="link" href={routeUrl} target="_blank" rel="noreferrer">Google Maps ↗</a> : <span className="small muted">ต้องมีอย่างน้อย 2 พิกัด</span>}</div>
          <TripMap apiKey={apiKey} points={mapPoints} compact />
          {!apiKey && <p className="map-setup-hint">แผนยังใช้ได้ตามปกติ แต่เพิ่ม Google Maps API key เพื่อเปิดแผนที่และค้นหาสถานที่</p>}
        </section>

        <section className="section planner-section">
          <div className="section-head"><h2>Timeline</h2><span className="small muted">ค้นหาสถานที่เพื่อบันทึกพิกัดอัตโนมัติ</span></div>

          {activities.length ? (
            <div className="planner-timeline">
              {activities.map((activity, index) => {
                const meta = typeMeta(activity.activity_type);
                return (
                  <article className="planner-activity" key={activity.id}>
                    <div className="planner-time-col"><strong>{activity.start_time?.slice(0, 5) || "—"}</strong>{index < activities.length - 1 && <span className="timeline-line" />}</div>
                    <div className="planner-activity-card">
                      <div className="activity-card-main">
                        <div className="activity-type-icon">{meta.icon}</div>
                        <div className="activity-copy">
                          <div className="activity-label">{meta.label}{activity.duration_minutes ? ` • ${activity.duration_minutes} นาที` : ""}</div>
                          <h3>{activity.title}</h3>
                          {activity.location_name && <p>📍 {activity.location_name}</p>}
                          {activity.latitude != null && activity.longitude != null && <a className="micro-link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`}>เปิดพิกัด ↗</a>}
                          {activity.notes && <p className="activity-notes">{activity.notes}</p>}
                          <div className="friendly-row">{activity.child_friendly && <span>👧 เด็ก</span>}{activity.senior_friendly && <span>👵 ผู้สูงอายุ</span>}{activity.latitude != null && <span>📌 มีพิกัด</span>}</div>
                        </div>
                      </div>

                      <details className="activity-editor">
                        <summary>แก้ไข</summary>
                        <form className="inline-form" action={updateActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} />
                          <div className="grid2"><input className="input" name="start_time" type="time" defaultValue={activity.start_time?.slice(0,5) || ""} /><select className="select" name="activity_type" defaultValue={activity.activity_type}><option value="attraction">สถานที่เที่ยว</option><option value="food">อาหาร</option><option value="transport">การเดินทาง</option><option value="shopping">ช้อปปิ้ง</option><option value="hotel">โรงแรม</option></select></div>
                          <input className="input" name="title" defaultValue={activity.title} required />
                          <PlacePicker apiKey={apiKey} initialName={activity.location_name} initialLat={activity.latitude == null ? null : Number(activity.latitude)} initialLng={activity.longitude == null ? null : Number(activity.longitude)} placeholder="ค้นหาสถานที่ / สถานี" />
                          <input className="input" name="duration_minutes" type="number" min="0" step="5" defaultValue={activity.duration_minutes || ""} placeholder="ระยะเวลา (นาที)" />
                          <textarea className="textarea" name="notes" defaultValue={activity.notes || ""} placeholder="หมายเหตุ" rows={3} />
                          <div className="check-row"><label><input type="checkbox" name="child_friendly" defaultChecked={activity.child_friendly} /> เหมาะกับเด็ก</label><label><input type="checkbox" name="senior_friendly" defaultChecked={activity.senior_friendly} /> เหมาะกับผู้สูงอายุ</label></div>
                          <SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึกการแก้ไข</SubmitButton>
                        </form>
                        <form action={deleteActivity} className="delete-form"><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} /><SubmitButton className="btn btn-danger btn-small" pendingText="กำลังลบ...">ลบกิจกรรม</SubmitButton></form>
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="empty-planner"><div>🗓️</div><strong>วันนี้ยังว่างอยู่</strong><p>เพิ่มสถานที่ ร้านอาหาร การเดินทาง หรือโรงแรมด้านล่าง</p></div>}
        </section>

        <section className="section add-activity-section">
          <details className="add-activity-panel" open={!activities.length}>
            <summary><span className="plus-circle">＋</span><span><strong>เพิ่มกิจกรรม</strong><small>Google Places • พิกัด • Pace Score</small></span></summary>
            <form className="inline-form add-activity-form" action={addActivity}>
              <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} />
              <div className="grid2"><div className="field"><label>เวลา</label><input className="input" name="start_time" type="time" /></div><div className="field"><label>ประเภท</label><select className="select" name="activity_type" defaultValue="attraction"><option value="attraction">📍 สถานที่เที่ยว</option><option value="food">🍜 อาหาร</option><option value="transport">🚆 การเดินทาง</option><option value="shopping">🛍️ ช้อปปิ้ง</option><option value="hotel">🏨 โรงแรม</option></select></div></div>
              <div className="field"><label>ชื่อกิจกรรม</label><input className="input" name="title" placeholder="เช่น Senso-ji" required /></div>
              <div className="field"><label>ค้นหาสถานที่ / สถานี</label><PlacePicker apiKey={apiKey} placeholder="เช่น Senso-ji, Tokyo Station" /></div>
              <div className="field"><label>ระยะเวลาโดยประมาณ (นาที)</label><input className="input" name="duration_minutes" type="number" min="0" step="5" placeholder="90" /></div>
              <div className="field"><label>หมายเหตุ</label><textarea className="textarea" name="notes" rows={3} placeholder="Ticket, จุดนัดพบ, สิ่งที่ต้องเตรียม..." /></div>
              <div className="check-row"><label><input type="checkbox" name="child_friendly" defaultChecked /> เหมาะกับเด็ก</label><label><input type="checkbox" name="senior_friendly" defaultChecked /> เหมาะกับผู้สูงอายุ</label></div>
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่มกิจกรรม...">+ เพิ่มลง Timeline</SubmitButton>
            </form>
          </details>
        </section>

        <section className="section"><details className="details-card"><summary>📝 ชื่อวันและโน้ตประจำวัน</summary><form className="inline-form" action={updateDay}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input className="input" name="day_title" defaultValue={day.title || `Day ${dayIndex + 1}`} placeholder="เช่น Tokyo East Side" /><textarea className="textarea" name="day_notes" defaultValue={day.notes || ""} rows={4} placeholder="โน้ตของวันนี้" /><SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึก</SubmitButton></form></details></section>
      </div>
      <BottomNav active="/plan" />
    </main>
  );
}
