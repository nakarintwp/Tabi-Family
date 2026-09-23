import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function WalletPage() {
  if (!hasSupabaseEnv()) {
    return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">Trip Wallet</h1><div className="empty-state"><div className="empty-icon">👛</div><h2>ยังไม่ได้เชื่อม Supabase</h2><p>ตั้งค่า Supabase ก่อนเพื่อใช้ Booking Wallet และ Expense Tracker</p></div></div><BottomNav active="/wallet" /></main>;
  }
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login?next=/wallet");
  const { data: trip } = await supabase.from("trips").select("id").order("start_date", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
  if (trip) redirect(`/trips/${trip.id}/wallet`);
  return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">Trip Wallet</h1><div className="empty-state"><div className="empty-icon">👛</div><h2>ยังไม่มีทริป</h2><p>สร้างทริปก่อน แล้วใช้ Wallet เก็บ Booking และค่าใช้จ่ายได้ฟรี</p><Link className="btn btn-primary" href="/trips/new">สร้างทริป</Link></div></div><BottomNav active="/wallet" /></main>;
}
