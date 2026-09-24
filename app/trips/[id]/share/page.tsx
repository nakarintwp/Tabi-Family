import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { InviteQr } from "@/components/InviteQr";
import { SubmitButton } from "@/components/SubmitButton";
import { changeCollaboratorRole, createInvite, removeCollaborator, revokeInvite } from "./actions";
import { requireVerifiedUser } from "@/lib/supabase/auth";

type Invite = {
  id: string;
  token: string;
  role: "editor" | "viewer";
  expires_at: string;
  max_uses: number;
  use_count: number;
  revoked_at: string | null;
  created_at: string;
};

type Collaborator = {
  user_id: string;
  email: string;
  role: "editor" | "viewer";
  joined_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ShareTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/share`);

  const [{ data: trip }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,owner_id").eq("id", id).maybeSingle(),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();

  if (role !== "owner") {
    return (
      <main className="shell">
        <div className="container"><AppHeader /><Link className="back-link" href={`/trips/${id}`}>‹ กลับทริป</Link><div className="empty-state"><div className="empty-icon">🔒</div><h1>เฉพาะเจ้าของทริป</h1><p>Editor และ Viewer ใช้งานทริปได้ตามสิทธิ์ แต่ไม่สามารถสร้าง QR หรือจัดการสมาชิกได้</p><Link className="btn btn-primary" href={`/trips/${id}`}>กลับ Dashboard</Link></div></div>
        <BottomNav active="/more" tripId={id} />
      </main>
    );
  }

  const [{ data: inviteRows }, { data: collaboratorRows, error: collaboratorError }] = await Promise.all([
    supabase.from("trip_invites").select("id,token,role,expires_at,max_uses,use_count,revoked_at,created_at").eq("trip_id", id).is("revoked_at", null).order("created_at", { ascending: false }).limit(6),
    supabase.rpc("get_trip_collaborators", { p_trip_id: id }),
  ]);

  const invites = ((inviteRows || []) as Invite[]).filter((invite) => new Date(invite.expires_at).getTime() > Date.now() && invite.use_count < invite.max_uses);
  const collaborators = (collaboratorRows || []) as Collaborator[];
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "tabi-family.vercel.app";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <Link className="back-link" href={`/trips/${id}`}>‹ กลับทริป</Link>
        <div className="page-head-row share-page-head"><div><span className="eyebrow">Family sharing</span><h1 className="page-title">แชร์ {trip.title}</h1><p className="page-subtitle">สร้าง QR ให้คนในครอบครัวสแกน แล้วเข้าสู่ระบบด้วย Email + Password</p></div><span className="role-badge owner">Owner</span></div>

        <section className="section">
          <div className="card share-create-card">
            <h2>สร้าง QR Invite ใหม่</h2>
            <p className="small muted">QR มี token แบบสุ่ม ไม่เปิดเผย Trip ID โดยตรง และสามารถยกเลิกได้ตลอดเวลา</p>
            <form className="inline-form" action={createInvite}>
              <input type="hidden" name="trip_id" value={id} />
              <div className="grid2">
                <div className="field"><label>สิทธิ์</label><select className="select" name="role" defaultValue="editor"><option value="editor">Editor · แก้แผนได้</option><option value="viewer">Viewer · ดูอย่างเดียว</option></select></div>
                <div className="field"><label>อายุ QR</label><select className="select" name="expires_hours" defaultValue="168"><option value="24">1 วัน</option><option value="168">7 วัน</option><option value="720">30 วัน</option></select></div>
              </div>
              <div className="field"><label>จำนวนคนที่ใช้ QR นี้ได้</label><input className="input" type="number" name="max_uses" min="1" max="100" defaultValue="5" /></div>
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังสร้าง QR…">สร้าง QR Invite</SubmitButton>
            </form>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>QR ที่ใช้งานได้</h2><span className="small muted">{invites.length} รายการ</span></div>
          {!invites.length ? <div className="empty-mini">ยังไม่มี QR ที่ใช้งานได้ · สร้างรายการด้านบน</div> : (
            <div className="share-invite-list">
              {invites.map((invite) => {
                const url = `${origin}/join/${invite.token}`;
                return <article className="card share-invite-card" key={invite.id}>
                  <div className="share-invite-head"><div><span className={`role-badge ${invite.role}`}>{invite.role === "editor" ? "Editor" : "Viewer"}</span><strong>ใช้แล้ว {invite.use_count}/{invite.max_uses}</strong></div><small>หมดอายุ {formatDate(invite.expires_at)}</small></div>
                  <InviteQr url={url} label={`${trip.title} (${invite.role})`} />
                  <form action={revokeInvite}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="invite_id" value={invite.id} /><SubmitButton className="btn btn-danger btn-small" pendingText="กำลังยกเลิก…">ยกเลิก QR นี้</SubmitButton></form>
                </article>;
              })}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head"><h2>สมาชิกที่เข้าร่วม</h2><span className="small muted">{collaborators.length + 1} บัญชี</span></div>
          <div className="member-access-list">
            <div className="card access-member-card"><div className="access-avatar">👑</div><div className="access-member-copy"><strong>คุณ</strong><span>เจ้าของทริป</span></div><span className="role-badge owner">Owner</span></div>
            {collaborators.map((member) => (
              <div className="card access-member-card" key={member.user_id}>
                <div className="access-avatar">👤</div>
                <div className="access-member-copy"><strong>{member.email || "สมาชิก"}</strong><span>เข้าร่วม {formatDate(member.joined_at)}</span></div>
                <form className="access-role-form" action={changeCollaboratorRole}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="user_id" value={member.user_id} /><select className="select compact-select" name="role" defaultValue={member.role}><option value="editor">Editor</option><option value="viewer">Viewer</option></select><SubmitButton className="btn btn-secondary btn-small" pendingText="บันทึก…">บันทึก</SubmitButton></form>
                <form action={removeCollaborator}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="user_id" value={member.user_id} /><SubmitButton className="btn btn-danger btn-small" pendingText="นำออก…">นำออก</SubmitButton></form>
              </div>
            ))}
          </div>
          {collaboratorError && <div className="error-box" style={{ marginTop: 12 }}>โหลดรายชื่อสมาชิกไม่สำเร็จ: {collaboratorError.message}</div>}
        </section>

        <section className="section"><div className="notice"><span>🛡️</span><div><strong>สิทธิ์การใช้งาน</strong><br/><span className="muted">Owner จัดการทุกอย่างและสมาชิก · Editor แก้แผน Packing Wallet และ Family ได้ · Viewer เปิดดู Today, Route และข้อมูลทริปได้อย่างเดียว</span></div></div></section>
      </div>
      <BottomNav active="/more" tripId={id} />
    </main>
  );
}
