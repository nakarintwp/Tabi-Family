import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_PLACES } from "@/lib/discovery";
import { savePlaceToWishlist } from "./actions";

const categoryLabels: Record<string, string> = {
  attraction: "เที่ยว",
  family: "ครอบครัว",
  nature: "ธรรมชาติ",
  museum: "พิพิธภัณฑ์",
  food: "อาหาร",
  shopping: "ช้อปปิ้ง",
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ city?: string; category?: string; saved?: string; error?: string }> }) {
  const query = await searchParams;
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const { data: trips } = await supabase.from("trips").select("id,title,owner_id").order("start_date", { ascending: true, nullsFirst: false });
  const rows = trips || [];
  const sharedIds = rows.filter((t) => t.owner_id !== userId).map((t) => t.id);
  const roleMap = new Map<string, string>();
  if (sharedIds.length) {
    const { data: roles } = await supabase.from("trip_collaborators").select("trip_id,role").eq("user_id", userId).in("trip_id", sharedIds);
    for (const item of roles || []) roleMap.set(item.trip_id, item.role);
  }
  const editableTrips = rows.filter((t) => t.owner_id === userId || roleMap.get(t.id) === "editor");

  const cities = Array.from(new Set(DISCOVERY_PLACES.map((p) => p.city)));
  const activeCity = query.city || "all";
  const activeCategory = query.category || "all";
  const filtered = DISCOVERY_PLACES.filter((place) =>
    (activeCity === "all" || place.city === activeCity) &&
    (activeCategory === "all" || place.category === activeCategory)
  );

  const buildHref = (city: string, category: string) => {
    const params = new URLSearchParams();
    if (city !== "all") params.set("city", city);
    if (category !== "all") params.set("category", category);
    const qs = params.toString();
    return `/explore${qs ? `?${qs}` : ""}`;
  };
  const returnTo = buildHref(activeCity, activeCategory);

  return <main className="shell"><div className="container"><AppHeader />
    <section className="discovery-hero">
      <div><span className="eyebrow">V7 · DISCOVERY</span><h1>Explore Japan</h1><p>เก็บสถานที่ที่สนใจก่อน แล้วค่อยโยนลงวันเดินทางเมื่อพร้อม</p></div>
      <Link className="btn btn-secondary" href="/templates">Trip Templates</Link>
    </section>

    {query.saved === "1" && <div className="success-box">บันทึกลง Wishlist แล้ว ✓</div>}
    {query.error && <div className="error-box">{query.error}</div>}

    <section className="section">
      <div className="section-head"><h2>เลือกเมือง</h2><span className="small muted">Curated · ไม่ใช้ Places API</span></div>
      <div className="filter-chip-row">
        <Link className={`filter-chip ${activeCity === "all" ? "active" : ""}`} href={buildHref("all", activeCategory)}>ทั้งหมด</Link>
        {cities.map((city) => <Link key={city} className={`filter-chip ${activeCity === city ? "active" : ""}`} href={buildHref(city, activeCategory)}>{city}</Link>)}
      </div>
      <div className="filter-chip-row compact-filter-row">
        <Link className={`filter-chip ${activeCategory === "all" ? "active" : ""}`} href={buildHref(activeCity, "all")}>ทุกประเภท</Link>
        {Object.entries(categoryLabels).map(([key, label]) => <Link key={key} className={`filter-chip ${activeCategory === key ? "active" : ""}`} href={buildHref(activeCity, key)}>{label}</Link>)}
      </div>
    </section>

    {!editableTrips.length && <div className="notice"><span>💡</span><div><strong>สร้างทริปก่อนเพื่อใช้ Wishlist</strong><br/><span className="muted">คุณยังดู Explore ได้ตามปกติ</span><br/><Link className="link" href="/trips/new">สร้างทริปใหม่ ›</Link></div></div>}

    <section className="explore-grid">
      {filtered.map((place) => <article className="place-card" key={place.slug}>
        <div className="place-card-cover"><span>{place.emoji}</span><div className="place-city-badge">{place.city}</div></div>
        <div className="place-card-body">
          <div className="place-meta">{place.area} · {categoryLabels[place.category] || place.category}</div>
          <h2>{place.title}</h2>
          <p>{place.summary}</p>
          <div className="tag-row">{place.tags.slice(0,3).map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}</div>
          <div className="place-facts"><span>{place.childFriendly ? "👧 Kids" : "—"}</span><span>{place.seniorFriendly ? "👵 Senior" : "⚠️ เดินเยอะ"}</span><span>{place.isOutdoor ? "🌤 Outdoor" : "🏠 Indoor"}</span></div>
          {editableTrips.length ? <form action={savePlaceToWishlist} className="wishlist-save-form">
            <input type="hidden" name="place_slug" value={place.slug} />
            <input type="hidden" name="return_to" value={returnTo} />
            <select className="select" name="trip_id" defaultValue={editableTrips[0]?.id}>
              {editableTrips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </select>
            <SubmitButton className="btn btn-primary" pendingText="กำลังบันทึก...">♡ Wishlist</SubmitButton>
          </form> : <Link href="/trips/new" className="btn btn-primary btn-full">สร้างทริปเพื่อบันทึก</Link>}
        </div>
      </article>)}
    </section>
  </div><BottomNav active="/explore" /></main>;
}
