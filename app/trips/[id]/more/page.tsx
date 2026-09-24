import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function ToolLink({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return <Link className="more-tool-row" href={href}><span className="more-tool-icon">{icon}</span><span className="more-tool-copy"><strong>{title}</strong><small>{description}</small></span><span className="more-tool-chevron">›</span></Link>;
}

export default async function TripMorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, userId } = await requireVerifiedUser(`/trips/${id}/more`);
  const { data: trip } = await supabase.from("trips").select("id,title,owner_id,cities,cover_emoji").eq("id", id).single();
  if (!trip) notFound();
  const { data: accessRole } = await supabase.rpc("trip_access_role", { p_trip_id: id });
  const role = (accessRole || (trip.owner_id === userId ? "owner" : "viewer")) as "owner" | "editor" | "viewer";
  const isOwner = role === "owner";

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Trip</Link><span className="planner-counter">V11.3 Navigation</span></div>
    <section className="planner-hero more-hero"><div><span className="eyebrow">SETTINGS · TOOLS · SAFETY</span><h1>••• More</h1><p>{trip.cover_emoji || "🧳"} {trip.title} · เครื่องมือที่ไม่ต้องใช้ทุกวันถูกรวมไว้ที่นี่</p></div><span className={`role-badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Editor" : "Viewer"}</span></section>

    <section className="more-group card"><div className="more-group-head"><span>🧳</span><div><h2>Trip setup</h2><p>ข้อมูลพื้นฐานและครอบครัว</p></div></div>
      <div className="more-tool-list">
        <ToolLink href="/trips" icon="🗾" title="All Trips" description="สลับทริป · สร้างทริปใหม่" />
        <ToolLink href={`/trips/${id}/destinations`} icon="📍" title="Destinations" description={(trip.cities || []).join(" • ") || "เลือกเมือง / พื้นที่"} />
        <ToolLink href={`/trips/${id}/family`} icon="👨‍👩‍👧" title="Family Profiles" description="สมาชิก · Child seat · Passport expiry" />
        <ToolLink href={`/trips/${id}/packing`} icon="🧳" title="Packing" description="Checklist ก่อนเดินทาง" />
        {isOwner && <ToolLink href={`/trips/${id}/cover`} icon="🎨" title="Trip Cover" description="สี · Emoji · Tagline" />}
        {isOwner && <ToolLink href={`/trips/${id}/share`} icon="📲" title="Share Trip" description="QR · Editor · Viewer" />}
        <ToolLink href="/account" icon="👤" title="Account" description="บัญชีและการเข้าสู่ระบบ" />
      </div>
    </section>

    <section className="more-group card"><div className="more-group-head"><span>🚙</span><div><h2>Drive & transport tools</h2><p>รถเช่า ค่าเดินทาง และ checklist</p></div></div>
      <div className="more-tool-list">
        <ToolLink href={`/trips/${id}/driving`} icon="🚙" title="Drive" description="Rental car · ETC · Fuel · Parking · Winter" />
        <ToolLink href={`/trips/${id}/route-cost`} icon="🧮" title="Route Cost" description="เปรียบเทียบ Train · Bus · Car" />
      </div>
    </section>

    <section className="more-group card"><div className="more-group-head"><span>📴</span><div><h2>Offline & safety</h2><p>ข้อมูลสำคัญเมื่อเดินทางจริง</p></div></div>
      <div className="more-tool-list">
        <ToolLink href={`/trips/${id}/offline-pack`} icon="📴" title="Offline Trip Pack" description="เก็บข้อมูลสำคัญไว้ในอุปกรณ์" />
        <ToolLink href={`/trips/${id}/emergency`} icon="🆘" title="Emergency Japan" description="110 · 119 · JNTO · ข้อความภาษาญี่ปุ่น" />
      </div>
    </section>

    <section className="more-group card"><div className="more-group-head"><span>💾</span><div><h2>Data & export</h2><p>สำรองข้อมูลและนำออก</p></div></div>
      <div className="more-tool-list">
        <ToolLink href={`/trips/${id}/backup`} icon="💾" title="Backup & Restore" description="JSON backup · Restore เป็น Trip ใหม่" />
        <ToolLink href={`/trips/${id}/export`} icon="⬇️" title="Export" description="PDF · CSV · Trip summary" />
      </div>
    </section>

    <section className="more-group card"><div className="more-group-head"><span>⚙️</span><div><h2>Advanced</h2><p>เครื่องมือที่ระบบใช้ช่วยตรวจแผน</p></div></div>
      <details className="more-advanced-details"><summary>แสดงเครื่องมือขั้นสูง</summary><div className="more-tool-list">
        <ToolLink href={`/trips/${id}/readiness`} icon="✅" title="Readiness" description="Checklist ความพร้อมของ Trip" />
        <ToolLink href={`/trips/${id}/notifications`} icon="🔔" title="Smart Alerts" description="สิ่งที่ควรตรวจและรายการค้าง" />
      </div></details>
    </section>
  </div><BottomNav active="/more" tripId={id} /></main>;
}
