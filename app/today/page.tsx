import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TodayMode } from "@/components/TodayMode";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireVerifiedUser } from "@/lib/supabase/auth";

export default async function TodayPage() {
  if (!hasSupabaseEnv()) {
    return <main className="shell"><div className="container"><AppHeader /><h1 className="page-title">Today</h1><div className="empty-state"><div className="empty-icon">⚙️</div><h2>ยังไม่ได้เชื่อม Supabase</h2><p>ตั้งค่า Supabase ก่อนเพื่อใช้ Today Mode</p></div></div><BottomNav active="/today" /></main>;
  }

  const { supabase } = await requireVerifiedUser("/today");

  const { data: trips } = await supabase
    .from("trips")
    .select("id,title,cities,start_date,end_date,trip_days(id,trip_date,title,activities(id,title,activity_type,start_time,duration_minutes,location_name,maps_url,latitude,longitude,notes,sort_order))")
    .order("start_date", { ascending: true, nullsFirst: false });

  return (
    <main className="shell">
      <div className="container today-container">
        <AppHeader />
        <TodayMode trips={trips || []} />
      </div>
      <BottomNav active="/today" />
    </main>
  );
}
