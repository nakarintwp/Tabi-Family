import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireVerifiedUser } from "@/lib/supabase/auth";

type MoreQuery = { trip?: string };

export default async function MorePage({ searchParams }: { searchParams: Promise<MoreQuery> }) {
  const query = await searchParams;
  if (!hasSupabaseEnv()) {
    return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">More</h1><div className="empty-state"><div className="empty-icon">•••</div><h2>ยังไม่ได้เชื่อม Supabase</h2><p>ตั้งค่า Supabase ก่อนเพื่อเปิดเครื่องมือเสริมของทริป</p></div></div><BottomNav active="/more" tripId={query.trip} /></main>;
  }

  const { supabase } = await requireVerifiedUser(query.trip ? `/more?trip=${encodeURIComponent(query.trip)}` : "/more");
  let tripQuery = supabase.from("trips").select("id").order("start_date", { ascending: true, nullsFirst: false }).limit(1);
  if (query.trip) tripQuery = supabase.from("trips").select("id").eq("id", query.trip).limit(1);
  const { data: trips } = await tripQuery;
  const trip = trips?.[0];
  if (trip) redirect(`/trips/${trip.id}/more`);

  return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">More</h1><div className="empty-state"><div className="empty-icon">🧳</div><h2>ยังไม่มีทริป</h2><p>สร้างทริปก่อน แล้วเครื่องมือ Family, Drive, Offline, Backup และ Emergency จะอยู่ที่นี่</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div></div><BottomNav active="/more" /></main>;
}
