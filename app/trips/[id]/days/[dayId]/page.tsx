import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaceScore } from "@/components/PaceScore";
import { CurrentLocationRoute } from "@/components/CurrentLocationRoute";
import { SubmitButton } from "@/components/SubmitButton";
import { calculatePaceScore, mapsSearchUrl } from "@/lib/trip-metrics";
import { createClient } from "@/lib/supabase/server";
import {
  addActivity,
  copyDayPlan,
  deleteActivity,
  duplicateActivity,
  moveActivity,
  reorderActivity,
  updateActivity,
  updateDay,
} from "./actions";

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
    supabase
      .from("trips")
      .select("id,title,cities,pace,trip_members(id,member_type,walking_level,avoid_stairs,needs_frequent_rest),trip_days(id,trip_date,title)")
      .eq("id", id)
      .single(),
    supabase
      .from("trip_days")
      .select("id,trip_id,trip_date,title,notes,activities(id,title,activity_type,start_time,duration_minutes,location_name,maps_url,latitude,longitude,notes,child_friendly,senior_friendly,sort_order,created_at)")
      .eq("id", dayId)
      .eq("trip_id", id)
      .single(),
  ]);

  if (!trip || !day) notFound();

  const days = [...(trip.trip_days || [])].sort((a, b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const dayIndex = days.findIndex((item) => item.id === day.id);
  const previousDay = dayIndex > 0 ? days[dayIndex - 1] : null;
  const nextDay = dayIndex >= 0 && dayIndex < days.length - 1 ? days[dayIndex + 1] : null;
  const otherDays = days.filter((item) => item.id !== day.id);
  const activities = [...(day.activities || [])].sort((a, b) => {
    const order = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    return order || String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });

  const metrics = calculatePaceScore(activities, trip.trip_members || [], trip.pace);
  const routeDestinations = activities
    .filter((activity) => Boolean(activity.location_name?.trim() || activity.title?.trim()) || (Number.isFinite(Number(activity.latitude)) && Number.isFinite(Number(activity.longitude))))
    .map((activity) => ({ id: activity.id, title: activity.title, locationName: activity.location_name, latitude: activity.latitude, longitude: activity.longitude }));

  return (
    <main className="shell">
      <div className="container day-planner-container">
        <AppHeader />

        <div className="planner-topbar">
          <Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link>
          <span className="planner-counter">Day {dayIndex + 1} / {days.length}</span>
        </div>

        <section className="planner-hero v4-hero">
          <div>
            <div className="eyebrow">Day Planner Pro · V4.1</div>
            <h1>{day.title || `Day ${dayIndex + 1}`}</h1>
            <p>{longDate(day.trip_date)}</p>
          </div>
          <span className="planner-count-badge">{activities.length} จุด</span>
        </section>

        <div className="day-switcher">
          {previousDay ? <Link href={`/trips/${trip.id}/days/${previousDay.id}`} className="day-switch-button">← Day {dayIndex}</Link> : <span />}
          {nextDay ? <Link href={`/trips/${trip.id}/days/${nextDay.id}`} className="day-switch-button">Day {dayIndex + 2} →</Link> : <span />}
        </div>

        <section className="section pace-section"><PaceScore {...metrics} /></section>

        <section className="section zero-cost-banner">
          <div className="zero-cost-icon">¥0</div>
          <div><strong>Current Location Route</strong><p>ใช้ตำแหน่งจากมือถือเป็นต้นทางได้ ปลายทางเพียง 1 จุดก็เปิดเส้นทางได้ โดยไม่ใช้ Maps API</p></div>
        </section>

        <section className="section">
          <CurrentLocationRoute destinations={routeDestinations} title="Route Map" />
        </section>

        <section className="section planner-section">
          <div className="section-head"><h2>Timeline</h2><span className="small muted">เรียง • คัดลอก • ย้ายวัน</span></div>

          {activities.length ? (
            <div className="planner-timeline">
              {activities.map((activity, index) => {
                const meta = typeMeta(activity.activity_type);
                const mapUrl = mapsSearchUrl(activity.location_name, activity.maps_url);
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
                          {mapUrl && <a className="micro-link" target="_blank" rel="noreferrer" href={mapUrl}>เปิด Google Maps ↗</a>}
                          {activity.notes && <p className="activity-notes">{activity.notes}</p>}
                          <div className="friendly-row">{activity.child_friendly && <span>👧 เด็ก</span>}{activity.senior_friendly && <span>👵 ผู้สูงอายุ</span>}</div>
                        </div>
                      </div>

                      <div className="activity-quick-tools">
                        <form action={reorderActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} /><input type="hidden" name="direction" value="up" />
                          <button className="tool-btn" disabled={index === 0} title="ย้ายขึ้น">↑</button>
                        </form>
                        <form action={reorderActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} /><input type="hidden" name="direction" value="down" />
                          <button className="tool-btn" disabled={index === activities.length - 1} title="ย้ายลง">↓</button>
                        </form>
                        <form action={duplicateActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} />
                          <button className="tool-btn wide">⧉ คัดลอก</button>
                        </form>
                      </div>

                      {otherDays.length > 0 && (
                        <form className="move-day-row" action={moveActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} />
                          <select className="select compact-select" name="target_day_id" defaultValue="" required>
                            <option value="" disabled>ย้ายไปวัน...</option>
                            {otherDays.map((target) => <option value={target.id} key={target.id}>{target.trip_date} · {target.title || "Day"}</option>)}
                          </select>
                          <SubmitButton className="btn btn-secondary btn-small" pendingText="ย้าย...">ย้าย</SubmitButton>
                        </form>
                      )}

                      <details className="activity-editor">
                        <summary>แก้ไขรายละเอียด</summary>
                        <form className="inline-form" action={updateActivity}>
                          <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input type="hidden" name="activity_id" value={activity.id} />
                          <div className="grid2"><input className="input" name="start_time" type="time" defaultValue={activity.start_time?.slice(0,5) || ""} /><select className="select" name="activity_type" defaultValue={activity.activity_type}><option value="attraction">สถานที่เที่ยว</option><option value="food">อาหาร</option><option value="transport">การเดินทาง</option><option value="shopping">ช้อปปิ้ง</option><option value="hotel">โรงแรม</option></select></div>
                          <input className="input" name="title" defaultValue={activity.title} required />
                          <input className="input" name="location_name" defaultValue={activity.location_name || ""} placeholder="ชื่อสถานที่ เช่น Senso-ji" />
                          <input className="input" name="maps_url" type="url" defaultValue={activity.maps_url || ""} placeholder="วางลิงก์ Google Maps (ไม่บังคับ)" />
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
            <summary><span className="plus-circle">＋</span><span><strong>เพิ่มกิจกรรม</strong><small>ไม่ใช้ API • ใส่ชื่อสถานที่หรือลิงก์ Maps ได้</small></span></summary>
            <form className="inline-form add-activity-form" action={addActivity}>
              <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} />
              <div className="grid2"><div className="field"><label>เวลา</label><input className="input" name="start_time" type="time" /></div><div className="field"><label>ประเภท</label><select className="select" name="activity_type" defaultValue="attraction"><option value="attraction">📍 สถานที่เที่ยว</option><option value="food">🍜 อาหาร</option><option value="transport">🚆 การเดินทาง</option><option value="shopping">🛍️ ช้อปปิ้ง</option><option value="hotel">🏨 โรงแรม</option></select></div></div>
              <div className="field"><label>ชื่อกิจกรรม</label><input className="input" name="title" placeholder="เช่น Senso-ji" required /></div>
              <div className="field"><label>ชื่อสถานที่</label><input className="input" name="location_name" placeholder="เช่น Senso-ji, Tokyo Station" /></div>
              <div className="field"><label>Google Maps URL (ไม่บังคับ)</label><input className="input" name="maps_url" type="url" placeholder="https://maps.app.goo.gl/..." /><small className="field-help">ถ้าไม่ใส่ ระบบจะสร้างลิงก์ค้นหา Google Maps จากชื่อสถานที่ให้เอง</small></div>
              <div className="field"><label>ระยะเวลาโดยประมาณ (นาที)</label><input className="input" name="duration_minutes" type="number" min="0" step="5" placeholder="90" /></div>
              <div className="field"><label>หมายเหตุ</label><textarea className="textarea" name="notes" rows={3} placeholder="Ticket, จุดนัดพบ, สิ่งที่ต้องเตรียม..." /></div>
              <div className="check-row"><label><input type="checkbox" name="child_friendly" defaultChecked /> เหมาะกับเด็ก</label><label><input type="checkbox" name="senior_friendly" defaultChecked /> เหมาะกับผู้สูงอายุ</label></div>
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่มกิจกรรม...">+ เพิ่มลง Timeline</SubmitButton>
            </form>
          </details>
        </section>

        {otherDays.length > 0 && activities.length > 0 && (
          <section className="section">
            <details className="details-card">
              <summary>⧉ คัดลอกแผนทั้งวันนี้ไปวันอื่น</summary>
              <form className="inline-form" action={copyDayPlan}>
                <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} />
                <select className="select" name="target_day_id" defaultValue="" required><option value="" disabled>เลือกวันปลายทาง</option>{otherDays.map((target) => <option value={target.id} key={target.id}>{target.trip_date} · {target.title || "Day"}</option>)}</select>
                <p className="small muted">ระบบจะเพิ่มกิจกรรมต่อท้ายวันปลายทาง โดยไม่ลบแผนเดิมของวันนั้น</p>
                <SubmitButton className="btn btn-secondary" pendingText="กำลังคัดลอก...">คัดลอกทั้งวัน</SubmitButton>
              </form>
            </details>
          </section>
        )}

        <section className="section"><details className="details-card"><summary>📝 ชื่อวันและโน้ตประจำวัน</summary><form className="inline-form" action={updateDay}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="day_id" value={day.id} /><input className="input" name="day_title" defaultValue={day.title || `Day ${dayIndex + 1}`} placeholder="เช่น Tokyo East Side" /><textarea className="textarea" name="day_notes" defaultValue={day.notes || ""} rows={4} placeholder="โน้ตของวันนี้" /><SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึก</SubmitButton></form></details></section>
      </div>
      <BottomNav active="/plan" />
    </main>
  );
}
