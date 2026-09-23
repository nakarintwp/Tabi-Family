import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteTripButton } from "@/components/DeleteTripButton";
import { createClient } from "@/lib/supabase/server";
import { addExpense, addMember, deleteTrip } from "./actions";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function activityIcon(type: string) {
  return type === "food" ? "🍜" : type === "transport" ? "🚆" : type === "shopping" ? "🛍️" : type === "hotel" ? "🏨" : "📍";
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/trips/${id}`);

  // One nested query replaces 5 separate database requests from V1.
  const { data: trip } = await supabase
    .from("trips")
    .select(`
      id,title,start_date,end_date,cities,pace,budget,currency,
      trip_members(id,name,member_type,walking_level,needs,created_at),
      trip_days(id,trip_date,title,notes,activities(id,title,activity_type,start_time,location_name,sort_order,duration_minutes,notes,child_friendly,senior_friendly)),
      expenses(id,amount,currency,category,note,paid_at)
    `)
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const members = [...(trip.trip_members || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const days = [...(trip.trip_days || [])].sort((a, b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const expenses = [...(trip.expenses || [])].sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)));
  const totalActivities = days.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  const plannedDays = days.filter((day) => (day.activities?.length || 0) > 0).length;
  const progress = days.length ? Math.round((plannedDays / days.length) * 100) : 0;
  const jpySpent = expenses.filter((e) => e.currency === "JPY").reduce((sum, e) => sum + Number(e.amount), 0);
  const thbSpent = expenses.filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);
  const firstDay = days[0];

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />

        <section className="hero compact-hero trip-hero">
          <div className="eyebrow">Trip dashboard</div>
          <h1>{trip.title}</h1>
          <p>{trip.cities?.join(" • ")}</p>
          <div className="hero-row">
            <div className="hero-stat"><strong>{days.length} วัน</strong><span>{trip.pace} pace</span></div>
            <div className="pill">👨‍👩‍👧‍👵 {members.length} คน</div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="card dashboard-metric">
            <span>วางแผนแล้ว</span>
            <strong>{plannedDays}/{days.length} วัน</strong>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <small>{progress}% ของทริป</small>
          </div>
          <div className="card dashboard-metric">
            <span>กิจกรรมทั้งหมด</span>
            <strong>{totalActivities} จุด</strong>
            <small>เพิ่ม/แก้ไขจาก Day Planner</small>
          </div>
        </section>

        <section className="quick-actions v3-quick-actions">
          {firstDay && <Link className="quick-action primary" href={`/trips/${trip.id}/days/${firstDay.id}`}><span>🗓️</span><strong>จัด Day 1</strong><small>เปิด Day Planner</small></Link>}
          <Link className="quick-action" href={`/trips/${trip.id}/family`}><span>👨‍👩‍👧‍👵</span><strong>Family</strong><small>โปรไฟล์แบบละเอียด</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/map`}><span>🗺️</span><strong>Map</strong><small>พิกัด + Pace Score</small></Link>
          <a className="quick-action" href="#budget"><span>💴</span><strong>Budget</strong><small>บันทึกค่าใช้จ่าย</small></a>
        </section>

        <section className="section">
          <div className="section-head"><h2>Itinerary</h2><span className="small muted">แตะวันเพื่อจัดรายละเอียด</span></div>
          <div className="day-dashboard-list">
            {days.map((day, index) => {
              const activities = [...(day.activities || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              return (
                <Link className="day-dashboard-card" href={`/trips/${trip.id}/days/${day.id}`} key={day.id}>
                  <div className="day-number"><span>DAY</span><strong>{index + 1}</strong></div>
                  <div className="day-dashboard-main">
                    <div className="day-dashboard-head"><div><strong>{day.title || `Day ${index + 1}`}</strong><small>{dateLabel(day.trip_date)}</small></div><span className={activities.length ? "badge success" : "badge"}>{activities.length ? `${activities.length} จุด` : "ยังว่าง"}</span></div>
                    {activities.length ? (
                      <div className="mini-timeline">
                        {activities.slice(0, 3).map((activity) => <span key={activity.id}>{activityIcon(activity.activity_type)} {activity.start_time?.slice(0,5) || "—"} {activity.title}</span>)}
                        {activities.length > 3 && <span className="muted">+ อีก {activities.length - 3} จุด</span>}
                      </div>
                    ) : <div className="empty-day">+ เริ่มวางแผนวันนี้</div>}
                  </div>
                  <span className="chevron">›</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section" id="family">
          <div className="section-head"><h2>สมาชิกครอบครัว</h2><Link href={`/trips/${trip.id}/family`} className="link">แก้ Family Profile ›</Link></div>
          <div className="family">
            {members.map((member) => (
              <div className="person" key={member.id}>
                <div className="face">{member.member_type === "child" ? "👧" : member.member_type === "senior" ? "👵" : "🧑"}</div>
                <strong>{member.name}</strong><small>เดิน {member.walking_level}/5</small>
              </div>
            ))}
          </div>
          <details className="details-card">
            <summary>+ เพิ่มสมาชิก</summary>
            <form className="inline-form" action={addMember}>
              <input type="hidden" name="trip_id" value={trip.id} />
              <input className="input" name="name" placeholder="ชื่อ เช่น Grandma" required />
              <div className="grid2">
                <select className="select" name="member_type" defaultValue="adult"><option value="adult">ผู้ใหญ่</option><option value="child">เด็ก</option><option value="senior">ผู้สูงอายุ</option></select>
                <select className="select" name="walking_level" defaultValue="3"><option value="1">เดิน 1/5</option><option value="2">เดิน 2/5</option><option value="3">เดิน 3/5</option><option value="4">เดิน 4/5</option><option value="5">เดิน 5/5</option></select>
              </div>
              <input className="input" name="needs" placeholder="ความต้องการ คั่นด้วย comma" />
              <SubmitButton className="btn btn-secondary" pendingText="กำลังเพิ่ม...">บันทึกสมาชิก</SubmitButton>
            </form>
          </details>
        </section>

        <section className="section" id="budget">
          <div className="section-head"><h2>ค่าใช้จ่าย</h2><Link href="/wallet" className="link">ดู Wallet ›</Link></div>
          <div className="grid2">
            <div className="card metric"><span className="metric-icon">💴</span><strong>¥{jpySpent.toLocaleString("th-TH")}</strong><span>ค่าใช้จ่าย JPY</span></div>
            <div className="card metric"><span className="metric-icon">💳</span><strong>฿{thbSpent.toLocaleString("th-TH")}</strong><span>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</span></div>
          </div>
          <details className="details-card">
            <summary>+ บันทึกค่าใช้จ่าย</summary>
            <form className="inline-form" action={addExpense}>
              <input type="hidden" name="trip_id" value={trip.id} />
              <div className="grid2"><input className="input" name="amount" type="number" min="0" step="0.01" placeholder="จำนวนเงิน" required /><select className="select" name="currency" defaultValue="JPY"><option value="JPY">JPY ¥</option><option value="THB">THB ฿</option></select></div>
              <div className="grid2"><select className="select" name="category"><option value="food">อาหาร</option><option value="transport">เดินทาง</option><option value="hotel">โรงแรม</option><option value="ticket">ตั๋ว</option><option value="shopping">ช้อปปิ้ง</option><option value="other">อื่น ๆ</option></select><input className="input" name="note" placeholder="หมายเหตุ" /></div>
              <SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึกค่าใช้จ่าย</SubmitButton>
            </form>
          </details>
        </section>

        <section className="section danger-zone">
          <div className="danger-zone-copy">
            <div>
              <span className="danger-kicker">จัดการทริป</span>
              <h2>ลบทริป</h2>
              <p>ลบได้เฉพาะทริปที่เป็นของบัญชีที่ล็อกอินอยู่ การลบจะลบวันเดินทาง กิจกรรม สมาชิก การจอง และค่าใช้จ่ายของทริปนี้ทั้งหมด</p>
            </div>
            <DeleteTripButton action={deleteTrip} tripId={trip.id} tripTitle={trip.title} />
          </div>
        </section>
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
