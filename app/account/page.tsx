import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AccountPage() {
  if (!hasSupabaseEnv()) redirect("/auth/login?error=missing_env");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <h1 className="page-title">บัญชี</h1>
        <div className="card profile-card">
          <div className="profile-avatar">👤</div>
          <div><strong>{user.email}</strong><p className="small muted">Supabase Auth · {user.id.slice(0, 8)}…</p></div>
        </div>
        <div className="stack section">
          <Link className="card action-link" href="/trips"><span>🗾 ทริปของฉัน</span><span>›</span></Link>
          <Link className="card action-link" href="/trips/new"><span>＋ สร้างทริปใหม่</span><span>›</span></Link>
          <form action={signOut}><button className="btn btn-secondary btn-full" type="submit">ออกจากระบบ</button></form>
        </div>
      </div>
      <BottomNav active="" />
    </main>
  );
}
