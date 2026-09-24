import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { createMember, deleteMember, updateMember } from "./actions";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function icon(type: string) {
  return type === "child" ? "👧" : type === "senior" ? "👵" : "🧑";
}

function memberLabel(type: string) {
  return type === "child" ? "เด็ก" : type === "senior" ? "ผู้สูงอายุ" : "ผู้ใหญ่";
}

function csv(values: string[] | null | undefined) {
  return (values || []).join(", ");
}

function MemberFields({ member }: { member?: any }) {
  return (
    <>
      <div className="grid2">
        <div className="field"><label>ชื่อ</label><input className="input" name="name" defaultValue={member?.name || ""} placeholder="เช่น Grandma" required /></div>
        <div className="field"><label>อายุ</label><input className="input" name="age" type="number" min="0" max="120" defaultValue={member?.age ?? ""} placeholder="67" /></div>
      </div>
      <div className="grid2">
        <div className="field"><label>ประเภท</label><select className="select" name="member_type" defaultValue={member?.member_type || "adult"}><option value="adult">ผู้ใหญ่</option><option value="child">เด็ก</option><option value="senior">ผู้สูงอายุ</option></select></div>
        <div className="field"><label>ความสามารถในการเดิน</label><select className="select" name="walking_level" defaultValue={String(member?.walking_level || 3)}><option value="1">1/5 เดินน้อยมาก</option><option value="2">2/5 เดินน้อย</option><option value="3">3/5 ปานกลาง</option><option value="4">4/5 เดินได้ดี</option><option value="5">5/5 เดินได้มาก</option></select></div>
      </div>
      <div className="field"><label>อาหาร / ข้อจำกัดอาหาร</label><input className="input" name="dietary_preferences" defaultValue={csv(member?.dietary_preferences)} placeholder="เช่น ไม่ทานหมู, แพ้ถั่ว" /></div>
      <div className="field"><label>ความสนใจ</label><input className="input" name="interests" defaultValue={csv(member?.interests)} placeholder="เช่น อาหาร, ธรรมชาติ, รถไฟ, ช้อปปิ้ง" /></div>
      <div className="field"><label>ความต้องการอื่น ๆ</label><input className="input" name="needs" defaultValue={csv(member?.needs)} placeholder="คั่นด้วย comma" /></div>
      <div className="field"><label>Mobility note</label><input className="input" name="mobility_notes" defaultValue={member?.mobility_notes || ""} placeholder="เช่น ใช้ไม้เท้า / เดินทางลาดได้" /></div>
      <div className="grid2">
        <div className="field"><label>Passport expiry</label><input className="input" name="passport_expiry" type="date" defaultValue={member?.passport_expiry || ""} /></div>
        <div className="field"><label>Seat preference</label><input className="input" name="seat_preference" defaultValue={member?.seat_preference || ""} placeholder="เช่น Window / Aisle / นั่งใกล้กัน" /></div>
      </div>
      <div className="grid2">
        <div className="field"><label>Rail pass / Ticket</label><input className="input" name="rail_pass" defaultValue={member?.rail_pass || ""} placeholder="เช่น IC card / JR pass / Individual ticket" /></div>
        <div className="field"><label>Emergency contact</label><input className="input" name="emergency_contact" defaultValue={member?.emergency_contact || ""} placeholder="ชื่อ + เบอร์โทร (ถ้าต้องการบันทึก)" /></div>
      </div>
      <div className="check-row family-checks">
        <label><input type="checkbox" name="avoid_stairs" defaultChecked={Boolean(member?.avoid_stairs)} /> หลีกเลี่ยงบันได</label>
        <label><input type="checkbox" name="needs_frequent_rest" defaultChecked={Boolean(member?.needs_frequent_rest)} /> ต้องพักบ่อย</label>
        <label><input type="checkbox" name="stroller" defaultChecked={Boolean(member?.stroller)} /> ใช้รถเข็นเด็ก</label>
        <label><input type="checkbox" name="child_seat" defaultChecked={Boolean(member?.child_seat)} /> Child seat</label>
        <label><input type="checkbox" name="booster_seat" defaultChecked={Boolean(member?.booster_seat)} /> Booster seat</label>
      </div>
      <div className="field"><label>หมายเหตุเอกสาร</label><input className="input" name="document_note" defaultValue={member?.document_note || ""} placeholder="เช่น Passport copy เก็บใน Trip Documents (ไม่แนะนำใส่เลข Passport)" /></div>
      <div className="field"><label>หมายเหตุ</label><textarea className="textarea" name="notes" defaultValue={member?.notes || ""} rows={3} placeholder="ข้อมูลเพิ่มเติมสำหรับการจัดแผน" /></div>
    </>
  );
}

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/family`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,trip_members(id,name,member_type,age,walking_level,needs,dietary_preferences,interests,mobility_notes,avoid_stairs,needs_frequent_rest,stroller,passport_expiry,seat_preference,rail_pass,child_seat,booster_seat,emergency_contact,document_note,notes,created_at)")
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const { data: accessRole } = await supabase.rpc("trip_access_role", { p_trip_id: id });
  const role = (accessRole || "viewer") as "owner" | "editor" | "viewer";
  const canEdit = role === "owner" || role === "editor";
  const members = [...(trip.trip_members || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  return (
    <main className="shell">
      <div className="container day-planner-container">
        <AppHeader />
        <div className="planner-topbar"><Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></div>
        <section className="planner-hero family-hero">
          <div><div className="eyebrow">Family profile</div><h1>ครอบครัวของทริปนี้</h1><p>{trip.title} · {members.length} คน</p></div>
          <span className="planner-count-badge">V9.4 · {members.length} คน</span>
        </section>

        <div className="notice family-note"><span>🎯</span><div><strong>ข้อมูลส่วนนี้ใช้คำนวณ Family Pace Score</strong><br/><span className="muted">ระดับการเดิน เด็ก ผู้สูงอายุ การพัก และข้อจำกัดจะถูกนำไปประเมินความแน่นของแต่ละวัน</span></div></div>

        <section className="section">
          <div className="section-head"><h2>สมาชิก</h2><span className="small muted">{canEdit ? "แก้ได้รายคน" : "ดูอย่างเดียว"}</span></div>
          <div className="family-profile-list">
            {members.map((member) => (
              <article className="family-profile-card" key={member.id}>
                <div className="family-profile-summary">
                  <div className="family-avatar-large">{icon(member.member_type)}</div>
                  <div className="family-profile-copy">
                    <div className="family-name-row"><strong>{member.name}</strong><span className="badge">{memberLabel(member.member_type)}</span></div>
                    <p>{member.age ? `${member.age} ปี · ` : ""}เดิน {member.walking_level}/5</p>
                    <div className="family-tags">
                      {member.avoid_stairs && <span>🚫 บันได</span>}
                      {member.needs_frequent_rest && <span>☕ พักบ่อย</span>}
                      {member.stroller && <span>🍼 รถเข็นเด็ก</span>}{member.child_seat && <span>🚙 Child seat</span>}{member.booster_seat && <span>💺 Booster</span>}{member.passport_expiry && <span>🛂 Exp {member.passport_expiry}</span>}
                      {(member.dietary_preferences || []).slice(0,2).map((item: string) => <span key={item}>🍽 {item}</span>)}
                    </div>
                  </div>
                </div>
                {canEdit && <details className="activity-editor family-editor">
                  <summary>แก้ไขโปรไฟล์</summary>
                  <form className="inline-form" action={updateMember}>
                    <input type="hidden" name="trip_id" value={trip.id} />
                    <input type="hidden" name="member_id" value={member.id} />
                    <MemberFields member={member} />
                    <SubmitButton className="btn btn-secondary" pendingText="กำลังบันทึก...">บันทึกโปรไฟล์</SubmitButton>
                  </form>
                  <form className="delete-form" action={deleteMember}>
                    <input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="member_id" value={member.id} />
                    <SubmitButton className="btn btn-danger btn-small" pendingText="กำลังลบ...">ลบสมาชิก</SubmitButton>
                  </form>
                </details>}
              </article>
            ))}
          </div>
        </section>

        {canEdit && <section className="section">
          <details className="add-activity-panel" open={!members.length}>
            <summary><span className="plus-circle">＋</span><span><strong>เพิ่มสมาชิก</strong><small>ข้อมูลละเอียดสำหรับการจัดแผนครอบครัว</small></span></summary>
            <form className="inline-form add-activity-form" action={createMember}>
              <input type="hidden" name="trip_id" value={trip.id} />
              <MemberFields />
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่ม...">+ เพิ่มสมาชิก</SubmitButton>
            </form>
          </details>
        </section>}
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
