import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function dateLabel(value: string | null) {
  if (!value) return "ยังไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export default async function TripsPage() {
  if (!hasSupabaseEnv()) redirect("/auth/login?error=missing_env");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login?next=/trips");

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id,title,start_date,end_date,cities,pace,budget,currency,created_at")
    .eq("owner_id", userId)
    .order("start_date", { ascending: true, nullsFirst: false });

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <div className="page-head-row">
          <div><h1 className="page-title">ทริปของฉัน</h1><p className="page-subtitle">ข้อมูลจาก Supabase ของบัญชีที่ล็อกอินอยู่</p></div>
          <Link className="btn btn-primary mini-btn" href="/trips/new">+ ใหม่</Link>
        </div>

        {error && <div className="error-box">โหลดข้อมูลไม่สำเร็จ: {error.message}</div>}

        {!trips?.length ? (
          <div className="empty-state">
            <div className="empty-icon">🗾</div>
            <h2>ยังไม่มีทริป</h2>
            <p>เริ่มจากสร้างทริปแรก ระบบจะสร้างวันเดินทางและ Family Profile ให้ทันที</p>
            <Link className="btn btn-primary" href="/trips/new">สร้างทริปแรก</Link>
          </div>
        ) : (
          <div className="stack">
            {trips.map((trip) => (
              <Link className="card trip-card" href={`/trips/${trip.id}`} key={trip.id}>
                <div className="trip-card-top"><span className="badge">{trip.pace}</span><span className="small muted">{dateLabel(trip.start_date)} → {dateLabel(trip.end_date)}</span></div>
                <h2>{trip.title}</h2>
                <p>{trip.cities?.join(" • ") || "Japan"}</p>
                <div className="trip-card-bottom">
                  <span>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</span>
                  <span className="link">เปิดทริป ›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
