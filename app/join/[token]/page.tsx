import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { acceptInvite } from "./actions";
import { getOptionalVerifiedUser } from "@/lib/supabase/auth";

export default async function JoinTripPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const { supabase, user } = await getOptionalVerifiedUser();
  const { data: previewRows } = await supabase.rpc("get_trip_invite_preview", { p_token: token });
  const preview = Array.isArray(previewRows) ? previewRows[0] : null;
  const loggedIn = Boolean(user);

  if (!preview) {
    return <main className="shell"><div className="container"><AppHeader /><div className="empty-state"><div className="empty-icon">🔗</div><h1>ไม่พบคำเชิญ</h1><p>QR หรือลิงก์นี้ไม่ถูกต้อง หรือถูกยกเลิกแล้ว</p><Link className="btn btn-primary" href="/trips">ไปที่ทริปของฉัน</Link></div></div><BottomNav active="/trips" /></main>;
  }

  const roleLabel = preview.invite_role === "editor" ? "Editor · แก้ไขแผนได้" : "Viewer · ดูอย่างเดียว";
  const available = Boolean(preview.available);

  return (
    <main className="shell">
      <div className="container join-container">
        <AppHeader />
        <section className="join-hero card">
          <div className="join-icon">🗾</div>
          <span className="eyebrow">Tabi Family Invite</span>
          <h1>{preview.trip_title}</h1>
          <div className={`role-badge ${preview.invite_role}`}>{roleLabel}</div>
          <p className="small muted">คำเชิญหมดอายุ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(preview.expires_at))}</p>
        </section>

        {query.error && <div className="error-box">เข้าร่วมไม่สำเร็จ: {query.error}</div>}

        {!available ? (
          <div className="empty-state compact-empty"><div className="empty-icon">⏳</div><h2>QR นี้ใช้ไม่ได้แล้ว</h2><p>คำเชิญอาจหมดอายุ ถูกยกเลิก หรือมีผู้ใช้ครบจำนวนแล้ว ให้เจ้าของทริปสร้าง QR ใหม่</p></div>
        ) : !loggedIn ? (
          <section className="card join-action-card"><h2>เข้าสู่ระบบก่อนเข้าร่วม</h2><p>ใช้ Email + Password เดียวกับ Tabi Family หรือสมัครบัญชีใหม่ได้ในหน้าเดียวกัน</p><Link className="btn btn-primary btn-full" href={`/auth/login?next=${encodeURIComponent(`/join/${token}`)}`}>เข้าสู่ระบบ / สมัครสมาชิก</Link></section>
        ) : (
          <section className="card join-action-card"><h2>พร้อมเข้าร่วมทริป</h2><p>หลังเข้าร่วม ทริปนี้จะปรากฏใน “ทริปของฉัน” และสิทธิ์จะถูกควบคุมด้วย Supabase RLS</p><form action={acceptInvite}><input type="hidden" name="token" value={token} /><SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเข้าร่วม…">เข้าร่วม {preview.trip_title}</SubmitButton></form></section>
        )}

        <div className="notice"><span>🔐</span><div>QR เก็บเฉพาะ invite token แบบสุ่ม ไม่ได้เก็บรหัสผ่านหรือข้อมูลส่วนตัวของสมาชิก</div></div>
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
