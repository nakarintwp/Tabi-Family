import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { addWishlistToDay, removeWishlistItem } from "./actions";

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", weekday: "short" }).format(new Date(`${date}T00:00:00`));
}

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/wishlist`);
  const [{ data: trip }, { data: items }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.from("trip_wishlist").select("*").eq("trip_id", id).order("created_at", { ascending: false }),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const days = [...(trip.trip_days || [])].sort((a, b) => a.trip_date.localeCompare(b.trip_date));

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}`} className="back-link">‹ Dashboard</Link><span className="planner-counter">Wishlist</span></div>
    <section className="planner-hero wishlist-hero"><div><span className="eyebrow">DISCOVER → SAVE → PLAN</span><h1>♡ Wishlist</h1><p>{trip.title}</p></div><Link className="btn btn-secondary" href="/explore">Explore Japan</Link></section>

    <section className="section">
      <div className="section-head"><h2>สถานที่ที่อยากไป</h2><span className="small muted">{items?.length || 0} จุด</span></div>
      {!items?.length ? <div className="empty-state"><div className="empty-icon">♡</div><h2>Wishlist ยังว่าง</h2><p>ไปหน้า Explore แล้วเก็บสถานที่ไว้ก่อน ไม่ต้องรีบกำหนดวัน</p><Link className="btn btn-primary" href="/explore">เปิด Explore Japan</Link></div> : <div className="wishlist-grid">
        {items.map((item) => <article className="wishlist-card" key={item.id}>
          <div className="wishlist-icon">{item.emoji || "📍"}</div>
          <div className="wishlist-copy"><span className="activity-label">{item.city || "Japan"} · {item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><div className="place-facts"><span>{item.child_friendly ? "👧 Kids" : ""}</span><span>{item.senior_friendly ? "👵 Senior" : "⚠️"}</span><span>{item.is_outdoor ? "🌤 Outdoor" : "🏠 Indoor"}</span></div></div>
          {canEdit && <div className="wishlist-actions">
            <form action={addWishlistToDay} className="wishlist-day-form">
              <input type="hidden" name="trip_id" value={id} /><input type="hidden" name="wishlist_id" value={item.id} />
              <select className="select" name="day_id" defaultValue={days[0]?.id}>{days.map((day, index) => <option value={day.id} key={day.id}>Day {index + 1} · {dayLabel(day.trip_date)}</option>)}</select>
              <SubmitButton className="btn btn-primary" pendingText="กำลังเพิ่ม...">+ ใส่ Day</SubmitButton>
            </form>
            <form action={removeWishlistItem}><input type="hidden" name="trip_id" value={id} /><input type="hidden" name="wishlist_id" value={item.id} /><button className="btn btn-secondary btn-full" type="submit">ลบจาก Wishlist</button></form>
          </div>}
        </article>)}
      </div>}
    </section>
  </div><BottomNav active="/explore" /></main>;
}
