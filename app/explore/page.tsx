import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_PLACES, googleMapsSearchUrl } from "@/lib/discovery";
import { savePlaceToWishlist } from "./actions";

const categoryLabels: Record<string, string> = {
  attraction: "เที่ยว",
  family: "ครอบครัว",
  nature: "ธรรมชาติ",
  museum: "พิพิธภัณฑ์",
  food: "อาหาร",
  shopping: "ช้อปปิ้ง",
};

type ExploreQuery = { city?: string; category?: string; trip?: string; popular?: string; saved?: string; error?: string };

type ExploreTrip = {
  id: string;
  title: string;
  owner_id: string;
  cities: string[] | null;
  start_date: string | null;
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<ExploreQuery> }) {
  const query = await searchParams;
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const { data: trips } = await supabase
    .from("trips")
    .select("id,title,owner_id,cities,start_date")
    .order("start_date", { ascending: true, nullsFirst: false });

  const rows: ExploreTrip[] = (trips || []) as ExploreTrip[];
  const sharedIds = rows.filter((t) => t.owner_id !== userId).map((t) => t.id);
  const roleMap = new Map<string, string>();
  if (sharedIds.length) {
    const { data: roles } = await supabase.from("trip_collaborators").select("trip_id,role").eq("user_id", userId).in("trip_id", sharedIds);
    for (const item of roles || []) roleMap.set(item.trip_id, item.role);
  }
  const editableTrips = rows.filter((t) => t.owner_id === userId || roleMap.get(t.id) === "editor");
  const selectedTrip = query.trip ? rows.find((trip) => trip.id === query.trip) : (query.city ? undefined : rows[0]);
  const selectedTripEditable = selectedTrip ? editableTrips.some((trip) => trip.id === selectedTrip.id) : false;

  const allCities: string[] = Array.from(new Set(DISCOVERY_PLACES.map((p) => p.city)));
  const tripCities: string[] = (selectedTrip?.cities || []).map((city: string) => String(city));
  const availableCities: string[] = tripCities.length ? tripCities : allCities;
  const activeCity = query.city && availableCities.includes(query.city) ? query.city : "all";
  const activeCategory = query.category || "all";
  const thaiPopularOnly = query.popular === "thai";

  const filtered = DISCOVERY_PLACES.filter((place) =>
    (!tripCities.length || tripCities.includes(place.city)) &&
    (activeCity === "all" || place.city === activeCity) &&
    (activeCategory === "all" || place.category === activeCategory) &&
    (!thaiPopularOnly || place.thaiPopular === true)
  );

  const buildHref = (city: string, category: string, tripId = selectedTrip?.id, popular = thaiPopularOnly) => {
    const params = new URLSearchParams();
    if (tripId) params.set("trip", tripId);
    if (city !== "all") params.set("city", city);
    if (category !== "all") params.set("category", category);
    if (popular) params.set("popular", "thai");
    const qs = params.toString();
    return `/explore${qs ? `?${qs}` : ""}`;
  };
  const returnTo = buildHref(activeCity, activeCategory, selectedTrip?.id);

  return <main className="shell"><div className="container"><AppHeader />
    <section className="discovery-hero">
      <div>
        <span className="eyebrow">V7.4 · THAI-FRIENDLY DISCOVERY</span>
        <h1>{selectedTrip ? `Explore · ${selectedTrip.title}` : "Explore Japan"}</h1>
        <p>{selectedTrip ? "แสดงเฉพาะเมืองและพื้นที่ที่ผูกกับทริปนี้" : "เลือกทริปก่อน แล้วระบบจะแสดงเฉพาะพื้นที่ที่คุณกำลังจะไป"}</p>
      </div>
      <Link className="btn btn-secondary" href="/templates">Trip Templates</Link>
    </section>

    {query.saved === "1" && <div className="success-box">บันทึกลง Wishlist แล้ว ✓</div>}
    {query.error && <div className="error-box">{query.error}</div>}

    {rows.length > 0 && <section className="section trip-scope-section">
      <div className="section-head"><h2>Explore ตามทริป</h2><span className="small muted">เมืองถูกกำหนดตอนสร้าง Trip</span></div>
      <div className="trip-scope-row">
        {rows.map((trip) => <Link key={trip.id} href={buildHref("all", activeCategory, trip.id)} className={`trip-scope-chip ${selectedTrip?.id === trip.id ? "active" : ""}`}>
          <span>🧳</span><div><strong>{trip.title}</strong><small>{(trip.cities || []).join(" • ") || "ยังไม่ได้เลือกเมือง"}</small></div>
        </Link>)}
      </div>
      {selectedTrip && <div className="trip-destination-summary">
        <div><strong>พื้นที่ของทริปนี้</strong><p>{tripCities.length ? tripCities.join(" → ") : "ยังไม่มีเมืองที่ตรงกับ Explore database"}</p></div>
        {selectedTrip.owner_id === userId && <Link className="link" href={`/trips/${selectedTrip.id}/destinations`}>แก้เมือง ›</Link>}
      </div>}
    </section>}

    <section className="section">
      <div className="section-head"><h2>{selectedTrip ? "เมืองในทริป" : "เลือกเมือง"}</h2><span className="small muted">{filtered.length} สถานที่ · Curated · ไม่ใช้ Places API</span></div>
      <div className="filter-chip-row">
        <Link className={`filter-chip ${activeCity === "all" ? "active" : ""}`} href={buildHref("all", activeCategory)}>ทั้งหมด</Link>
        {availableCities.map((city: string) => <Link key={city} className={`filter-chip ${activeCity === city ? "active" : ""}`} href={buildHref(city, activeCategory)}>{city}</Link>)}
      </div>
      <div className="filter-chip-row compact-filter-row">
        <Link className={`filter-chip thai-popular-filter ${thaiPopularOnly ? "active" : ""}`} href={buildHref(activeCity, activeCategory, selectedTrip?.id, !thaiPopularOnly)}>คนไทยนิยม</Link>
        <Link className={`filter-chip ${activeCategory === "all" ? "active" : ""}`} href={buildHref(activeCity, "all")}>ทุกประเภท</Link>
        {Object.entries(categoryLabels).map(([key, label]) => <Link key={key} className={`filter-chip ${activeCategory === key ? "active" : ""}`} href={buildHref(activeCity, key)}>{label}</Link>)}
      </div>
    </section>

    {!rows.length && <div className="notice"><span>💡</span><div><strong>สร้างทริปก่อนเพื่อให้ Explore รู้ว่าคุณจะไปไหน</strong><br/><span className="muted">เมืองที่เลือกตอนสร้าง Trip จะกลายเป็นตัวกรองอัตโนมัติ</span><br/><Link className="link" href="/trips/new">สร้างทริปใหม่ ›</Link></div></div>}

    {!filtered.length && <div className="empty-state"><div className="empty-icon">🗺️</div><h2>ยังไม่มีสถานที่ในพื้นที่นี้</h2><p>ลองเปลี่ยนเมืองหรือกลับไปแก้ Destinations ของ Trip</p>{selectedTrip && selectedTrip.owner_id === userId && <Link className="btn btn-primary" href={`/trips/${selectedTrip.id}/destinations`}>แก้เมืองในทริป</Link>}</div>}

    <section className="explore-grid">
      {filtered.map((place) => <article className="place-card" key={place.slug}>
        <div className="place-card-cover"><span>{place.emoji}</span><div className="place-city-badge">{place.city}</div>{place.thaiPopular && <div className="thai-popular-badge">คนไทยนิยม</div>}</div>
        <div className="place-card-body">
          <div className="place-meta">{place.area} · {categoryLabels[place.category] || place.category}</div>
          <h2>{place.title}</h2>
          <p>{place.summary}</p>
          {place.thaiPopular && place.thaiNote && <div className="thai-popular-note">{place.thaiNote}</div>}
          <div className="tag-row">{place.tags.slice(0,3).map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}</div>
          <div className="place-facts"><span>{place.childFriendly ? "👧 Kids" : "—"}</span><span>{place.seniorFriendly ? "👵 Senior" : "⚠️ เดินเยอะ"}</span><span>{place.isOutdoor ? "🌤 Outdoor" : "🏠 Indoor"}</span></div>
          <a className="btn btn-secondary btn-full explore-map-link" href={googleMapsSearchUrl(place.title, place.city)} target="_blank" rel="noreferrer">เปิด Google Maps</a>
          {selectedTrip ? (
            selectedTripEditable ? <form action={savePlaceToWishlist} className="wishlist-save-form">
              <input type="hidden" name="place_slug" value={place.slug} />
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="trip_id" value={selectedTrip.id} />
              <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">♡ Wishlist · {selectedTrip.title}</SubmitButton>
            </form> : <div className="small muted">Viewer สามารถดูสถานที่ได้ แต่แก้ Wishlist ไม่ได้</div>
          ) : editableTrips.length ? <form action={savePlaceToWishlist} className="wishlist-save-form">
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
