import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { changePassword, signOut } from "./actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ password_changed?: string; password_error?: string }> }) {
  const query = await searchParams;
  if (!hasSupabaseEnv()) redirect("/auth/login?error=missing_env");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  const passwordError = query.password_error === "short"
    ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
    : query.password_error === "mismatch"
      ? "รหัสผ่านทั้งสองช่องไม่ตรงกัน"
      : query.password_error;

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <h1 className="page-title">บัญชี</h1>
        {query.password_changed === "1" && <div className="success-box">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</div>}
        {passwordError && <div className="error-box">เปลี่ยนรหัสผ่านไม่สำเร็จ: {passwordError}</div>}
        <div className="card profile-card">
          <div className="profile-avatar">👤</div>
          <div><strong>{user.email}</strong><p className="small muted">Email + Password · {user.id.slice(0, 8)}…</p></div>
        </div>
        <div className="stack section">
          <Link className="card action-link" href="/trips"><span>🗾 ทริปของฉัน</span><span>›</span></Link>
          <Link className="card action-link" href="/trips/new"><span>＋ สร้างทริปใหม่</span><span>›</span></Link>
          <details className="details-card"><summary>🔐 เปลี่ยนรหัสผ่าน</summary><form className="inline-form" action={changePassword}><input className="input" type="password" name="password" minLength={8} placeholder="รหัสผ่านใหม่ อย่างน้อย 8 ตัว" required /><input className="input" type="password" name="confirm_password" minLength={8} placeholder="ยืนยันรหัสผ่านใหม่" required /><SubmitButton className="btn btn-secondary" pendingText="กำลังเปลี่ยน…">เปลี่ยนรหัสผ่าน</SubmitButton></form></details>
          <form action={signOut}><button className="btn btn-secondary btn-full" type="submit">ออกจากระบบ</button></form>
        </div>
      </div>
      <BottomNav active="" />
    </main>
  );
}
