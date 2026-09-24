import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireVerifiedUser } from "@/lib/supabase/auth";

type PlanQuery = { trip?: string };

export default async function PlanPage({ searchParams }: { searchParams: Promise<PlanQuery> }) {
  const query = await searchParams;
  if (!hasSupabaseEnv()) {
    return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">Plan</h1><div className="empty-state"><div className="empty-icon">📅</div><h2>ยังไม่ได้เชื่อม Supabase</h2><p>ตั้งค่า Supabase ก่อนเพื่อเปิดแผนทริป</p></div></div><BottomNav active="/plan" tripId={query.trip} /></main>;
  }

  const { supabase } = await requireVerifiedUser(query.trip ? `/plan?trip=${encodeURIComponent(query.trip)}` : "/plan");
  let tripQuery = supabase.from("trips").select("id,title").order("start_date", { ascending: true, nullsFirst: false }).limit(1);
  if (query.trip) tripQuery = supabase.from("trips").select("id,title").eq("id", query.trip).limit(1);
  const { data: trips } = await tripQuery;
  const trip = trips?.[0];
  if (trip) redirect(`/trips/${trip.id}/master-plan`);

  return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">Plan</h1><div className="empty-state"><div className="empty-icon">📅</div><h2>ยังไม่มีทริป</h2><p>สร้างทริปก่อน แล้ว Plan จะรวม Itinerary, Map, Route และ Check ไว้ในที่เดียว</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div></div><BottomNav active="/plan" /></main>;
}
