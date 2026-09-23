import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getOptionalVerifiedUser } from "@/lib/supabase/auth";

function formatRange(start: string | null, end: string | null) {
  if (!start || !end) return "ยังไม่กำหนดวันเดินทาง";
  const fmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(new Date(`${start}T00:00:00`))} – ${fmt.format(new Date(`${end}T00:00:00`))}`;
}

export default async function HomePage() {
  let userId: string | undefined;
  let trip: null | { id: string; title: string; start_date: string | null; end_date: string | null; cities: string[]; pace: string; budget: number | null; cover_style?: string | null; cover_emoji?: string | null; cover_tagline?: string | null } = null;
  let memberCount = 0;
  let dayCount = 0;
  let expenseTotalTHB = 0;

  if (hasSupabaseEnv()) {
    const { supabase, user } = await getOptionalVerifiedUser();
    userId = user?.id;
    if (userId) {
      const { data } = await supabase
        .from("trips")
        .select("id,title,start_date,end_date,cities,pace,budget,cover_style,cover_emoji,cover_tagline")
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      trip = data;

      if (trip) {
        const [{ count: members }, { count: days }, { data: expenses }] = await Promise.all([
          supabase.from("trip_members").select("id", { count: "exact", head: true }).eq("trip_id", trip.id),
          supabase.from("trip_days").select("id", { count: "exact", head: true }).eq("trip_id", trip.id),
          supabase.from("expenses").select("amount,currency").eq("trip_id", trip.id),
        ]);
        memberCount = members ?? 0;
        dayCount = days ?? 0;
        expenseTotalTHB = (expenses || []).filter((e) => e.currency === "THB").reduce((sum, e) => sum + Number(e.amount), 0);
      }
    }
  }

  if (!userId || !trip) {
    return (
      <main className="shell">
        <div className="container">
          <AppHeader />
          <section className="hero welcome-hero">
            <div className="eyebrow">Japan family trip planner</div>
            <h1>จัดทริปญี่ปุ่นให้เหมาะกับทุกคนในครอบครัว</h1>
            <p>วางแผนรายวัน สมาชิกครอบครัว ค่าใช้จ่าย และข้อมูลสำคัญในที่เดียว</p>
            <div className="hero-actions">
              <Link className="btn hero-btn" href={userId ? "/trips/new" : "/auth/login"}>{userId ? "สร้างทริปแรก" : "เข้าสู่ระบบ"}</Link>
              <Link className="btn hero-btn ghost" href="/trips">ดูทริป</Link>
            </div>
          </section>

          <section className="section">
            <div className="section-head"><h2>สิ่งที่พร้อมใช้แล้ว</h2><span className="badge success">V7</span></div>
            <div className="feature-grid">
              <div className="card feature-card"><span>✨</span><strong>Explore Japan</strong><small>เลือกสถานที่ curated แล้วเก็บลง Wishlist</small></div>
              <div className="card feature-card"><span>🧩</span><strong>Trip Templates</strong><small>เริ่มทริปจากแผนตัวอย่างสำหรับครอบครัว</small></div>
              <div className="card feature-card"><span>📆</span><strong>Calendar + Transport</strong><small>เห็นภาพรวมทั้งทริปและช่วงรถไฟ/รถบัส</small></div>
              <div className="card feature-card"><span>✅</span><strong>Trip Readiness</strong><small>เช็กความพร้อมก่อนเดินทางแบบ 0–100%</small></div>
            </div>
          </section>

          {!hasSupabaseEnv() && <section className="section"><div className="notice"><span>⚙️</span><div><strong>ยังไม่ได้เชื่อม Supabase</strong><br/><span className="muted">ตั้งค่า Environment Variables ใน Vercel เพื่อเปิด Login และฐานข้อมูลจริง</span></div></div></section>}
        </div>
        <BottomNav active="/" />
      </main>
    );
  }

  const budgetPercent = trip.budget ? Math.min(100, Math.round((expenseTotalTHB / Number(trip.budget)) * 100)) : 0;

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <section className={`hero trip-cover cover-${trip.cover_style || "sky"}`}>
          <div className="eyebrow">Current family trip</div>
          <div className="hero-cover-title"><span className="hero-cover-emoji">{trip.cover_emoji || "🧳"}</span><div><h1>{trip.title}</h1><p>{trip.cover_tagline || trip.cities?.join(" • ")} · {formatRange(trip.start_date, trip.end_date)}</p></div></div>
          <div className="hero-row">
            <div className="hero-stat"><strong>{dayCount} วัน</strong><span>{trip.pace} pace</span></div>
            <div className="pill">👨‍👩‍👧‍👵 {memberCount} คน</div>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>จัดการทริป</h2><Link className="link" href={`/trips/${trip.id}`}>เปิดทั้งหมด ›</Link></div>
          <div className="quick-grid v7-home-grid">
            <Link className="card quick-card" href="/today"><span>☀️</span><strong>Today</strong><small>แผนวันนี้ + GPS</small></Link>
            <Link className="card quick-card" href="/explore"><span>✨</span><strong>Explore</strong><small>หาไอเดียสถานที่</small></Link>
            <Link className="card quick-card" href={`/trips/${trip.id}/calendar`}><span>📆</span><strong>Calendar</strong><small>{dayCount} วัน</small></Link>
            <Link className="card quick-card" href={`/trips/${trip.id}/readiness`}><span>✅</span><strong>Readiness</strong><small>เช็กก่อนเดินทาง</small></Link>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>งบประมาณ</h2><span className="link">{trip.budget ? `${budgetPercent}%` : "ยังไม่ตั้งงบ"}</span></div>
          <div className="card">
            <strong style={{ fontSize: 24 }}>฿{expenseTotalTHB.toLocaleString("th-TH")}</strong>
            <div className="activity-meta">{trip.budget ? `จากงบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "เพิ่มค่าใช้จ่ายได้ในหน้าทริป"}</div>
            {trip.budget && <div className="progress"><i style={{ width: `${budgetPercent}%` }} /></div>}
          </div>
        </section>
      </div>
      <BottomNav active="/" />
    </main>
  );
}
