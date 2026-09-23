import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import { addPackingItem, deletePackingItem, seedPackingList, togglePackingItem } from "./actions";

const categoryMeta: Record<string, { icon: string; label: string }> = {
  documents: { icon: "🪪", label: "เอกสาร" },
  clothes: { icon: "🧥", label: "เสื้อผ้า" },
  electronics: { icon: "🔌", label: "อุปกรณ์ไฟฟ้า" },
  health: { icon: "💊", label: "สุขภาพ" },
  kids: { icon: "🧸", label: "เด็ก" },
  other: { icon: "🎒", label: "อื่น ๆ" },
};

export default async function PackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth/login?next=/trips/${id}/packing`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,trip_members(id,name),packing_items(id,label,category,assigned_to,quantity,is_packed,notes,sort_order,created_at)")
    .eq("id", id)
    .single();
  if (!trip) notFound();

  const { data: accessRole } = await supabase.rpc("trip_access_role", { p_trip_id: id });
  const role = (accessRole || "viewer") as "owner" | "editor" | "viewer";
  const canEdit = role === "owner" || role === "editor";

  const items = [...(trip.packing_items || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const packed = items.filter((item) => item.is_packed).length;
  const percent = items.length ? Math.round((packed / items.length) * 100) : 0;
  const grouped = Object.entries(categoryMeta)
    .map(([key, meta]) => ({ key, ...meta, items: items.filter((item) => item.category === key) }))
    .filter((group) => group.items.length);

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <div className="planner-topbar"><Link href={`/trips/${trip.id}`} className="back-link">‹ Dashboard</Link><div className="planner-role-row"><span className="planner-counter">Packing</span><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></div></div>
        <section className="planner-hero packing-hero"><div><div className="eyebrow">Travel readiness</div><h1>🧳 Packing List</h1><p>{trip.title}</p></div><span className="planner-count-badge">{packed}/{items.length}</span></section>

        <section className="card packing-progress-card">
          <div className="section-head"><div><strong>พร้อมเดินทาง {percent}%</strong><p className="small muted">ติ๊กเมื่อจัดของลงกระเป๋าแล้ว</p></div><span className="packing-percent">{percent}%</span></div>
          <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
        </section>

        {!items.length && (
          <section className="empty-state packing-empty"><div className="empty-icon">🎒</div><h2>ยังไม่มี Packing list</h2><p>{canEdit ? "เริ่มจากรายการพื้นฐานสำหรับทริปญี่ปุ่น หรือเพิ่มของเองด้านล่าง" : "ยังไม่มี Packing list"}</p>{canEdit && <form action={seedPackingList}><input type="hidden" name="trip_id" value={trip.id} /><SubmitButton className="btn btn-primary" pendingText="กำลังสร้าง...">สร้างรายการเริ่มต้น</SubmitButton></form>}</section>
        )}

        {grouped.map((group) => (
          <section className="section" key={group.key}>
            <div className="section-head"><h2>{group.icon} {group.label}</h2><span className="small muted">{group.items.filter((i) => i.is_packed).length}/{group.items.length}</span></div>
            <div className="packing-list">
              {group.items.map((item) => (
                <div className={`packing-row ${item.is_packed ? "packed" : ""}`} key={item.id}>
                  {canEdit ? <form action={togglePackingItem}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="item_id" value={item.id} /><input type="hidden" name="is_packed" value={String(item.is_packed)} /><button className="packing-check" aria-label={item.is_packed ? "Mark unpacked" : "Mark packed"}>{item.is_packed ? "✓" : ""}</button></form> : <span className="packing-check readonly">{item.is_packed ? "✓" : ""}</span>}
                  <div className="packing-copy"><strong>{item.label}{item.quantity > 1 ? ` ×${item.quantity}` : ""}</strong>{item.assigned_to && <small>👤 {item.assigned_to}</small>}{item.notes && <small>{item.notes}</small>}</div>
                  {canEdit && <form action={deletePackingItem}><input type="hidden" name="trip_id" value={trip.id} /><input type="hidden" name="item_id" value={item.id} /><button className="icon-danger" aria-label="ลบ">×</button></form>}
                </div>
              ))}
            </div>
          </section>
        ))}

        {canEdit && <section className="section">
          <details className="add-activity-panel" open={!items.length}>
            <summary><span className="plus-circle">＋</span><span><strong>เพิ่มของที่ต้องเตรียม</strong><small>จัดหมวดและมอบหมายให้สมาชิกได้</small></span></summary>
            <form className="inline-form" action={addPackingItem}>
              <input type="hidden" name="trip_id" value={trip.id} />
              <input className="input" name="label" placeholder="เช่น เสื้อกันหนาวของลูก" required />
              <div className="grid2"><select className="select" name="category" defaultValue="other"><option value="documents">เอกสาร</option><option value="clothes">เสื้อผ้า</option><option value="electronics">อุปกรณ์ไฟฟ้า</option><option value="health">สุขภาพ</option><option value="kids">เด็ก</option><option value="other">อื่น ๆ</option></select><input className="input" name="quantity" type="number" min="1" max="99" defaultValue="1" /></div>
              <select className="select" name="assigned_to" defaultValue=""><option value="">ไม่ระบุคนรับผิดชอบ</option>{(trip.trip_members || []).map((member) => <option value={member.name} key={member.id}>{member.name}</option>)}</select>
              <input className="input" name="notes" placeholder="หมายเหตุ (ไม่บังคับ)" />
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังเพิ่ม...">+ เพิ่มรายการ</SubmitButton>
            </form>
          </details>
        </section>}
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
