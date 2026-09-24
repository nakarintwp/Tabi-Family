import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { removeDuplicateTrips } from "./actions";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function dateLabel(value: string | null) {
  if (!value) return "ยังไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

type TripRow = {
  id: string;
  owner_id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cities: string[] | null;
  pace: string | null;
  budget: number | null;
  currency: string | null;
  created_at: string;
  cover_style?: string | null;
  cover_emoji?: string | null;
  cover_tagline?: string | null;
  template_key?: string | null;
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
  const { supabase, userId } = await requireVerifiedUser("/trips");

  // RLS returns both owned trips and trips shared with this account.
  const { data: trips, error } = await supabase
    .from("trips")
    .select("id,owner_id,title,start_date,end_date,cities,pace,budget,currency,created_at,cover_style,cover_emoji,cover_tagline,template_key")
    .order("start_date", { ascending: true, nullsFirst: false });

  const rows = (trips || []) as TripRow[];
  const sharedIds = rows.filter((trip) => trip.owner_id !== userId).map((trip) => trip.id);
  const roleMap = new Map<string, "editor" | "viewer">();
  if (sharedIds.length) {
    const { data: memberships } = await supabase
      .from("trip_collaborators")
      .select("trip_id,role")
      .eq("user_id", userId)
      .in("trip_id", sharedIds);
    for (const item of memberships || []) roleMap.set(item.trip_id, item.role as "editor" | "viewer");
  }

  const ownRows = rows.filter((trip) => trip.owner_id === userId);
  const seen = new Set<string>();
  let duplicateCount = 0;
  for (const trip of ownRows) {
    const key = duplicateKey(trip);
    if (seen.has(key)) duplicateCount += 1;
    else seen.add(key);
  }

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <div className="page-head-row">
          <div><h1 className="page-title">ทริปของฉัน</h1><p className="page-subtitle">รวมทั้งทริปที่สร้างเองและทริปที่ครอบครัวแชร์ให้</p></div>
          <Link className="btn btn-primary mini-btn" href="/trips/new">+ ใหม่</Link>
        </div>

        {query.deleted === "1" && <div className="success-box">ลบทริปเรียบร้อยแล้ว</div>}
        {query.deduped !== undefined && <div className="success-box">จัดการรายการซ้ำแล้ว: ลบ {Number(query.deduped || 0)} ทริป</div>}
        {query.dedupe_error && <div className="error-box">ลบรายการซ้ำไม่สำเร็จ: {query.dedupe_error}</div>}
        {error && <div className="error-box">โหลดข้อมูลไม่สำเร็จ: {error.message}</div>}

        {duplicateCount > 0 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <strong>พบ Trip ของคุณซ้ำ {duplicateCount} รายการ</strong>
            <p className="small muted" style={{ marginTop: 6 }}>ระบบจะจัดการเฉพาะทริปที่คุณเป็น Owner เท่านั้น และไม่แตะทริปที่คนอื่นแชร์ให้</p>
            <form action={removeDuplicateTrips} style={{ marginTop: 10 }}>
              <SubmitButton className="btn btn-secondary" pendingText="กำลังลบรายการซ้ำ...">ลบ Trip ที่ซ้ำ</SubmitButton>
            </form>
          </div>
        )}

        {!rows.length ? (
          <div className="empty-state">
            <div className="empty-icon">🗾</div>
            <h2>ยังไม่มีทริป</h2>
            <p>สร้างทริปแรก หรือสแกน QR จากคนในครอบครัวเพื่อเข้าร่วมทริปที่แชร์ไว้</p>
            <Link className="btn btn-primary" href="/trips/new">สร้างทริปแรก</Link>
          </div>
        ) : (
          <div className="stack">
            {rows.map((trip) => {
              const role = trip.owner_id === userId ? "owner" : (roleMap.get(trip.id) || "viewer");
              return (
                <Link className="card trip-card v7-trip-card" href={`/trips/${trip.id}`} key={trip.id}>
                  <div className={`trip-list-cover trip-cover cover-${trip.cover_style || "sky"}`}><span>{trip.cover_emoji || "🧳"}</span><div><strong>{trip.cover_tagline || trip.cities?.join(" • ") || "Family journey"}</strong>{trip.template_key && <small>Template trip</small>}</div></div>
                  <div className="trip-card-top"><div className="trip-badge-row"><span className="badge">{trip.pace}</span><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></div><span className="small muted">{dateLabel(trip.start_date)} → {dateLabel(trip.end_date)}</span></div>
                  <h2>{trip.title}</h2>
                  <p>{trip.cities?.join(" • ") || "Japan"}</p>
                  <div className="trip-card-bottom">
                    <span>{trip.budget ? `งบ ฿${Number(trip.budget).toLocaleString("th-TH")}` : "ยังไม่ตั้งงบ"}</span>
                    <span className="link">เปิดทริป ›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav active="/more" />
    </main>
  );
}
