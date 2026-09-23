import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { removeDuplicateTrips } from "./actions";

function dateLabel(value: string | null) {
  if (!value) return "ยังไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

type TripRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cities: string[] | null;
  pace: string | null;
  budget: number | null;
  currency: string | null;
  created_at: string;
};

function duplicateKey(trip: TripRow) {
  return JSON.stringify([
    trip.title.trim().toLowerCase(),
    trip.start_date,
    trip.end_date,
    trip.cities || [],
    trip.pace,
    trip.budget,
    trip.currency,
  ]);
}

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ deleted?: string; deduped?: string; dedupe_error?: string }> }) {
  const query = await searchParams;
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

  const rows = (trips || []) as TripRow[];
  const seen = new Set<string>();
  let duplicateCount = 0;
  for (const trip of rows) {
    const key = duplicateKey(trip);
    if (seen.has(key)) duplicateCount += 1;
    else seen.add(key);
  }

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <div className="page-head-row">
          <div><h1 className="page-title">ทริปของฉัน</h1><p className="page-subtitle">ข้อมูลจาก Supabase ของบัญชีที่ล็อกอินอยู่</p></div>
          <Link className="btn btn-primary mini-btn" href="/trips/new">+ ใหม่</Link>
        </div>

        {query.deleted === "1" && <div className="success-box">ลบทริปเรียบร้อยแล้ว</div>}
        {query.deduped !== undefined && <div className="success-box">จัดการรายการซ้ำแล้ว: ลบ {Number(query.deduped || 0)} ทริป</div>}
        {query.dedupe_error && <div className="error-box">ลบรายการซ้ำไม่สำเร็จ: {query.dedupe_error}</div>}
        {error && <div className="error-box">โหลดข้อมูลไม่สำเร็จ: {error.message}</div>}

        {duplicateCount > 0 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <strong>พบ Trip ซ้ำ {duplicateCount} รายการ</strong>
            <p className="small muted" style={{ marginTop: 6 }}>ระบบจะเก็บรายการแรกของแต่ละชุดไว้ และลบเฉพาะรายการที่ชื่อ วันที่ เมือง รูปแบบทริป และงบตรงกันทั้งหมด</p>
            <form action={removeDuplicateTrips} style={{ marginTop: 10 }}>
              <SubmitButton className="btn btn-secondary" pendingText="กำลังลบรายการซ้ำ...">ลบ Trip ที่ซ้ำ</SubmitButton>
            </form>
          </div>
        )}

        {!rows.length ? (
          <div className="empty-state">
            <div className="empty-icon">🗾</div>
            <h2>ยังไม่มีทริป</h2>
            <p>เริ่มจากสร้างทริปแรก ระบบจะสร้างวันเดินทางและ Family Profile ให้ทันที</p>
            <Link className="btn btn-primary" href="/trips/new">สร้างทริปแรก</Link>
          </div>
        ) : (
          <div className="stack">
            {rows.map((trip) => (
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
