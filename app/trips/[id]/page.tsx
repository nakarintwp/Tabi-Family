import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { addActivity, addExpense, addMember } from "./actions";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/trips/${id}`);

  const [{ data: trip }, { data: members }, { data: days }, { data: expenses }] = await Promise.all([
    supabase.from("trips").select("id,title,start_date,end_date,cities,pace,budget,currency").eq("id", id).single(),
    supabase.from("trip_members").select("id,name,member_type,walking_level,needs").eq("trip_id", id).order("created_at"),
    supabase.from("trip_days").select("id,trip_date,title,notes").eq("trip_id", id).order("trip_date"),
    supabase.from("expenses").select("id,amount,currency,category,note,paid_at").eq("trip_id", id).order("paid_at", { ascending: false }),
  ]);

  if (!trip) notFound();

  const dayIds = (days || []).map((day) => day.id);
  const { data: activities } = dayIds.length
    ? await supabase.from("activities").select("id,day_id,title,activity_type,start_time,location_name,sort_order").in("day_id", dayIds).order("sort_order")
    : { data: [] as Array<{ id: string; day_id: string; title: string; activity_type: string; start_time: string | null; location_name: string | null; sort_order: number }> };

  const jpySpent = (expenses || []).filter((e) => e.currency === "JPY").reduce((sum, e) => sum + Number(e.amount), 0);
  const thbSpent = (expenses || []).filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />

        <section className="hero compact-hero">
          <div className="eyebrow">Your live trip</div>
          <h1>{trip.title}</h1>
          <p>{trip.cities?.join(" • ")}</p>
          <div className="hero-row"><div className="hero-stat"><strong>{days?.length || 0} วัน</strong><span>{trip.pace} pace</span></div><div className="pill">👨‍👩‍👧‍👵 {members?.length || 0} คน</div></div>
        </section>

        <section className="section">
          <div className="section-head"><h2>สมาชิกครอบครัว</h2><span className="link">Family Profile</span></div>
          <div className="family">
            {(members || []).map((member) => (
              <div className="person" key={member.id}>
                <div className="face">{member.member_type === "child" ? "👧" : member.member_type === "senior" ? "👵" : "🧑"}</div>
                <strong>{member.name}</strong>
                <small>เดิน {member.walking_level}/5</small>
              </div>
            ))}
            {!members?.length && <div className="person"><div className="face">➕</div><strong>เพิ่มสมาชิก</strong><small>สร้าง Family Profile</small></div>}
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
              <button className="btn btn-secondary" type="submit">บันทึกสมาชิก</button>
            </form>
          </details>
        </section>

        <section className="section">
          <div className="section-head"><h2>Itinerary</h2><Link href="/plan" className="link">ดู Plan ›</Link></div>
          <div className="stack">
            {(days || []).map((day, index) => {
              const dayActivities = (activities || []).filter((activity) => activity.day_id === day.id);
              return (
                <details className="day-card" key={day.id} open={index === 0}>
                  <summary><span><strong>Day {index + 1}</strong><small>{dateLabel(day.trip_date)}</small></span><span className="badge">{dayActivities.length} จุด</span></summary>
                  <div className="day-content">
                    {dayActivities.length ? dayActivities.map((activity) => (
                      <div className="activity-row" key={activity.id}>
                        <div className="activity-time">{activity.start_time?.slice(0, 5) || "—"}</div>
                        <div><strong>{activity.title}</strong><small>{activity.location_name || activity.activity_type}</small></div>
                      </div>
                    )) : <p className="small muted">ยังไม่มีกิจกรรมในวันนี้</p>}

                    <form className="inline-form soft-form" action={addActivity}>
                      <input type="hidden" name="trip_id" value={trip.id} />
                      <input type="hidden" name="day_id" value={day.id} />
                      <div className="grid2"><input className="input" name="start_time" type="time" /><select className="select" name="activity_type"><option value="attraction">สถานที่เที่ยว</option><option value="food">อาหาร</option><option value="transport">การเดินทาง</option><option value="shopping">ช้อปปิ้ง</option><option value="hotel">โรงแรม</option></select></div>
                      <input className="input" name="title" placeholder="กิจกรรม เช่น Senso-ji" required />
                      <input className="input" name="location_name" placeholder="สถานที่ / สถานี" />
                      <button className="btn btn-secondary" type="submit">+ เพิ่มกิจกรรม</button>
                    </form>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>ค่าใช้จ่าย</h2><span className="link">Budget tracker</span></div>
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
              <button className="btn btn-secondary" type="submit">บันทึกค่าใช้จ่าย</button>
            </form>
          </details>
        </section>
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
