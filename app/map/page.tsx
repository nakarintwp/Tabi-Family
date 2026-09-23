import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function MapPage() {
  if (!hasSupabaseEnv()) {
    return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">แผนที่ทริป</h1><div className="empty-state"><div className="empty-icon">🗺️</div><h2>ยังไม่ได้เชื่อม Supabase</h2><p>ตั้งค่า Supabase ก่อนเพื่อเปิดแผนที่จากทริปจริง</p></div></div><BottomNav active="/map" /></main>;
  }
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login?next=/map");
  const { data: trip } = await supabase.from("trips").select("id").order("start_date", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
  if (trip) redirect(`/trips/${trip.id}/map`);
  return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">แผนที่ทริป</h1><div className="empty-state"><div className="empty-icon">🗾</div><h2>ยังไม่มีทริป</h2><p>สร้างทริปก่อน แล้วระบบจะแสดงพิกัดและเส้นทางรายวัน</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div></div><BottomNav active="/map" /></main>;
}
