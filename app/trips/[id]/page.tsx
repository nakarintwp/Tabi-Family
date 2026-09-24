import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteTripButton } from "@/components/DeleteTripButton";
import { ReadinessCard } from "@/components/ReadinessCard";
import { addExpense, addMember, deleteTrip } from "./actions";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { calculateReadiness } from "@/lib/trip-readiness";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}
function activityIcon(type: string) {
  return type === "food" ? "🍜" : type === "transport" ? "🚆" : type === "shopping" ? "🛍️" : type === "hotel" ? "🏨" : "📍";
}

export default async function TripDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ joined?: string; delete_error?: string; setup_error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, userId } = await requireVerifiedUser(`/trips/${id}`);

  const { data: trip } = await supabase
    .from("trips")
    .select(`
      id,owner_id,title,start_date,end_date,cities,pace,budget,currency,cover_style,cover_emoji,cover_tagline,template_key,
      trip_members(id,name,member_type,walking_level,needs,created_at),
      trip_days(id,trip_date,title,notes,activities(id,title,activity_type,start_time,location_name,sort_order,duration_minutes,notes,child_friendly,senior_friendly,status)),
      expenses(id,amount,currency,category,note,paid_at),
      bookings(id,booking_type),
      packing_items(id,is_packed)
    `)
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const [{ data: accessRole }, { data: activityFeed }, { count: transportCount }, { count: wishlistCount }] = await Promise.all([
    supabase.rpc("trip_access_role", { p_trip_id: id }),
    supabase.rpc("get_trip_activity_feed", { p_trip_id: id, p_limit: 8 }),
    supabase.from("transport_segments").select("id", { count: "exact", head: true }).eq("trip_id", id),
    supabase.from("trip_wishlist").select("id", { count: "exact", head: true }).eq("trip_id", id),
  ]);
  const role = (accessRole || (trip.owner_id === userId ? "owner" : "viewer")) as "owner" | "editor" | "viewer";
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  const members = [...(trip.trip_members || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const days = [...(trip.trip_days || [])].sort((a, b) => String(a.trip_date).localeCompare(String(b.trip_date)));
  const expenses = [...(trip.expenses || [])].sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)));
  const bookings = trip.bookings || [];
  const packingItems = trip.packing_items || [];
  const packedItems = packingItems.filter((item: { is_packed: boolean }) => item.is_packed).length;
  const totalActivities = days.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  const plannedDays = days.filter((day) => (day.activities?.length || 0) > 0).length;
  const progress = days.length ? Math.round((plannedDays / days.length) * 100) : 0;
  const jpySpent = expenses.filter((e) => e.currency === "JPY").reduce((sum, e) => sum + Number(e.amount), 0);
  const thbSpent = expenses.filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);
  const firstDay = days[0];
  const readiness = calculateReadiness({
    startDate: trip.start_date,
    endDate: trip.end_date,
    cities: trip.cities,
    membersCount: members.length,
    daysCount: days.length,
    plannedDays,
    bookings,
    packingCount: packingItems.length,
    packedCount: packedItems,
    transportCount: transportCount || 0,
  });
  const coverStyle = trip.cover_style || "sky";

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        {query.joined === "1" && <div className="success-box">เข้าร่วมทริปเรียบร้อยแล้ว ✓</div>}
        {query.delete_error && <div className="error-box"><strong>ลบทริปไม่สำเร็จ</strong><br/><span>{query.delete_error}</span></div>}
        {query.setup_error && <div className="error-box"><strong>ตั้งค่าทริปไม่สมบูรณ์</strong><br/><span>{query.setup_error}</span></div>}

        <section className={`hero compact-hero trip-hero trip-cover cover-${coverStyle}`}>
          <div className="trip-hero-role-row"><div className="eyebrow">Trip dashboard · V7.9 Smart Route</div><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></div>
          <div className="hero-cover-title"><span className="hero-cover-emoji">{trip.cover_emoji || "🧳"}</span><div><h1>{trip.title}</h1><p>{trip.cover_tagline || trip.cities?.join(" • ")}</p></div></div>
          <div className="hero-row"><div className="hero-stat"><strong>{days.length} วัน</strong><span>{trip.pace} pace</span></div><div className="pill">👨‍👩‍👧‍👵 {members.length} คน</div></div>
        </section>

        {!canEdit && <div className="notice viewer-notice"><span>👀</span><div><strong>Viewer mode</strong><br/><span className="muted">คุณดูแผน Today, Calendar, Transport, Wishlist และ Wallet ได้ แต่การแก้ไขถูกปิดด้วย RLS</span></div></div>}

        <section className="dashboard-grid">
          <div className="card dashboard-metric"><span>วางแผนแล้ว</span><strong>{plannedDays}/{days.length} วัน</strong><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{progress}% ของทริป</small></div>
          <div className="card dashboard-metric"><span>Discovery</span><strong>{wishlistCount || 0} Wishlist</strong><small>{transportCount || 0} transport segment</small></div>
        </section>

        <ReadinessCard tripId={trip.id} score={readiness.score} label={readiness.label} items={readiness.items} compact />

        <section className="quick-actions v7-quick-actions">
          {firstDay && <Link className="quick-action primary" href={`/trips/${trip.id}/days/${firstDay.id}`}><span>🗓️</span><strong>Day Planner</strong><small>{canEdit ? "เรียง • ย้าย • คัดลอก" : "ดู Timeline"}</small></Link>}
          <Link className="quick-action" href={`/trips/${trip.id}/calendar`}><span>📆</span><strong>Calendar</strong><small>ภาพรวมทั้งทริป</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/wishlist`}><span>♡</span><strong>Wishlist</strong><small>{wishlistCount || 0} สถานที่</small></Link>
          <Link className="quick-action" href={`/explore?trip=${trip.id}`}><span>✨</span><strong>Explore</strong><small>{trip.cities?.join(" • ") || "ค้นไอเดีย"}</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/smart-plan`}><span>🪄</span><strong>Smart Day</strong><small>จัดสถานที่ลงวัน</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/destinations`}><span>📍</span><strong>Destinations</strong><small>{trip.cities?.length || 0} เมือง</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/transport`}><span>🚆</span><strong>Transport</strong><small>{transportCount || 0} ช่วง</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/route`}><span>🛣️</span><strong>Trip Route</strong><small>รวมรถไฟ • Bus • รถเช่า</small></Link>
          <Link className="quick-action" href="/today"><span>☀️</span><strong>Today</strong><small>แผนวันนี้ + GPS</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/family`}><span>👨‍👩‍👧‍👵</span><strong>Family</strong><small>โปรไฟล์ครอบครัว</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/map`}><span>🧭</span><strong>Map / GPS</strong><small>Current location</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/packing`}><span>🧳</span><strong>Packing</strong><small>{packingItems.length ? `${packedItems}/${packingItems.length} พร้อม` : "Checklist"}</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/wallet`}><span>👛</span><strong>Wallet</strong><small>{bookings.length} booking</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/weather`}><span>🌦️</span><strong>Weather</strong><small>Rain Plan ฟรี</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/export`}><span>⬇️</span><strong>Export</strong><small>PDF • CSV • Backup</small></Link>
          <Link className="quick-action" href={`/trips/${trip.id}/readiness`}><span>✅</span><strong>Readiness</strong><small>{readiness.score}% พร้อม</small></Link>
          {isOwner && <Link className="quick-action" href={`/trips/${trip.id}/cover`}><span>🎨</span><strong>Trip Cover</strong><small>สี • Emoji • Tagline</small></Link>}
          {isOwner && <Link className="quick-action share-quick-action" href={`/trips/${trip.id}/share`}><span>📲</span><strong>แชร์ทริป</strong><small>QR • Editor • Viewer</small></Link>}
        </section>

        <section className="section">
          <div className="section-head"><h2>Itinerary</h2><Link href={`/trips/${trip.id}/calendar`} className="link">Calendar Overview ›</Link></div>
          <div className="day-dashboard-list">
            {days.map((day, index) => {
              const activities = [...(day.activities || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              return <Link className="day-dashboard-card" href={`/trips/${trip.id}/days/${day.id}`} key={day.id}>
                <div className="day-number"><span>DAY</span><strong>{index + 1}</strong></div>
                <div className="day-dashboard-main"><div className="day-dashboard-head"><div><strong>{day.title || `Day ${index + 1}`}</strong><small>{dateLabel(day.trip_date)}</small></div><span className={activities.length ? "badge success" : "badge"}>{activities.length ? `${activities.length} จุด` : "ยังว่าง"}</span></div>{activities.length ? <div className="mini-timeline">{activities.slice(0, 3).map((activity) => <span key={activity.id}>{activityIcon(activity.activity_type)} {activity.start_time?.slice(0,5) || "—"} {activity.title}</span>)}{activities.length > 3 && <span className="muted">+ อีก {activities.length - 3} จุด</span>}</div> : <div className="empty-day">{canEdit ? "+ เริ่มวางแผนวันนี้" : "ยังไม่มีแผนวันนี้"}</div>}</div>
                <span className="chevron">›</span>
              </Link>;
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>การเปลี่ยนแปลงล่าสุด</h2>{isOwner && <Link href={`/trips/${trip.id}/share`} className="link">จัดการสมาชิก ›</Link>}</div>
          {(activityFeed || []).length ? <div className="activity-feed">{(activityFeed || []).map((item:any) => <div className="activity-feed-row" key={item.id}><div className="activity-feed-dot">•</div><div><strong>{item.summary}</strong><small>{item.actor_email || "System"} · {new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.created_at))}</small></div></div>)}</div> : <div className="empty-mini">ยังไม่มีประวัติการแก้ไข</div>}
        </section>

        <section className="section" id="family">
          <div className="section-head"><h2>สมาชิกครอบครัว</h2><Link href={`/trips/${trip.id}/family`} className="link">{canEdit ? "แก้" : "ดู"} Family Profile ›</Link></div>
          <div className="family">{members.map((member) => <div className="person" key={member.id}><div className="face">{member.member_type === "child" ? "👧" : member.member_type === "senior" ? "👵" : "🧑"}</div><strong>{member.name}</strong><small>เดิน {member.walking_level}/5</small></div>)}</div>
          {canEdit && <details className="details-card"><summary>+ เพิ่มสมาชิก</summary><form className="inline-form" action={addMember}><input type="hidden" name="trip_id" value={trip.id} /><input className="input" name="name" placeholder="ชื่อ เช่น Grandma" required /><div className="grid2"><select className="select" name="member_type" defaultValue="adult"><option value="adult">ผู้ใหญ่</option><option value="child">เด็ก</option><option value="senior">ผู้สูงอายุ</option></select><select className="select" name="walking_level" defaultValue="3"><option value="1">เดิน 1/5</option><option value="2">เดิน 2/5</option><option value="3">เดิน 3/5</option><option value="4">เดิน 4/5</option><option value="5">เดิน 5/5</option></select></div><input className="input" name="needs" placeholder="ความต้องการ คั่นด้วย comma" /><SubmitButton className="btn btn-secondary" pendingText="กำลังเพิ่ม...">บันทึกสมาชิก</SubmitButton></form></details>}
        </section>

        <section className="section" id="budget">
          <div className="section-head"><h2>ค่าใช้จ่าย</h2><Link href={`/trips/${trip.id}/wallet`} className="link">เปิด Wallet ›</Link></div>
          <div className="grid2"><div className="card metric"><span className="metric-icon">💴</span><strong>¥{jpySpent.toLocaleString("th-TH")}</strong><span>ค่าใช้จ่าย JPY</span></div><div className="card metric"><span className="metric-icon">💳</span><strong>฿{thbSpent.toLocaleString("th-TH")}</strong><span>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</span></div></div>
          {canEdit && <details className="details-card"><summary>+ บันทึกค่าใช้จ่าย</summary><form className="inline-form" action={addExpense}><input type="hidden" name="trip_id" value={trip.id} /><div className="grid2"><input className="input" name="amount" type="number" min="0" step="0.01" placeholder="จำนวนเงิน" required /><select className="select" name="currency" defaultValue="JPY"><option value="JPY">JPY ¥</option><option value="THB">THB ฿</option></select></div><div className="grid2"><select className="select" name="category"><option value="food">อาหาร</option><option value="transport">เดินทาง</option><option value="hotel">โรงแรม</option><option value="ticket">ตั๋ว</option><option value="shopping">ช้อปปิ้ง</option><option value="other">อื่น ๆ</option></select><input className="input" name="note" placeholder="หมายเหตุ" /></div><SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึกค่าใช้จ่าย</SubmitButton></form></details>}
        </section>

        {isOwner && <section className="section danger-zone"><div className="danger-zone-copy"><div><span className="danger-kicker">จัดการทริป</span><h2>ลบทริป</h2><p>เฉพาะ Owner เท่านั้นที่ลบทริปได้ การลบจะลบข้อมูลทั้งหมดรวมถึงสมาชิกที่เข้าร่วมและ QR Invites</p></div><DeleteTripButton action={deleteTrip} tripId={trip.id} tripTitle={trip.title} /></div></section>}
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
