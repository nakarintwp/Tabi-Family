import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { ExploreCoordinateMap } from "@/components/ExploreCoordinateMap";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_PLACES, FOOD_FILTERS, getPlaceGuide, googleMapsSearchUrl, matchesFoodFilter } from "@/lib/discovery";
import { addPlaceToDay, savePlaceToWishlist } from "./actions";

const categoryLabels: Record<string, string> = {
  attraction: "เที่ยว",
  family: "ครอบครัว",
  nature: "ธรรมชาติ",
  museum: "พิพิธภัณฑ์",
  food: "อาหาร",
  shopping: "ช้อปปิ้ง",
};

type ExploreQuery = { city?: string; category?: string; trip?: string; popular?: string; food?: string; saved?: string; added?: string; error?: string };
type TripDay = { id: string; trip_date: string; title: string | null };
type ExploreTrip = {
  id: string;
  title: string;
  owner_id: string;
  cities: string[] | null;
  start_date: string | null;
  trip_days?: TripDay[] | null;
};

function dayLabel(value: string, index: number) {
  return `Day ${index + 1} · ${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`))}`;
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<ExploreQuery> }) {
  const query = await searchParams;
  const { supabase, userId } = await requireVerifiedUser("/explore");
  const { data: trips } = await supabase
    .from("trips")
    .select("id,title,owner_id,cities,start_date,trip_days(id,trip_date,title)")
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
  const selectedDays = [...(selectedTrip?.trip_days || [])].sort((a, b) => a.trip_date.localeCompare(b.trip_date));

  const allCities: string[] = Array.from(new Set(DISCOVERY_PLACES.map((p) => p.city)));
  const tripCities: string[] = (selectedTrip?.cities || []).map((city: string) => String(city));
  const availableCities: string[] = tripCities.length ? tripCities : allCities;
  const activeCity = query.city && availableCities.includes(query.city) ? query.city : "all";
  const activeFood = query.food || "all";
  const activeCategory = activeFood !== "all" ? "food" : (query.category || "all");
  const thaiPopularOnly = query.popular === "thai";

  const filtered = DISCOVERY_PLACES.filter((place) =>
    (!tripCities.length || tripCities.includes(place.city)) &&
    (activeCity === "all" || place.city === activeCity) &&
    (activeCategory === "all" || place.category === activeCategory) &&
    (!thaiPopularOnly || place.thaiPopular === true) &&
    (activeFood === "all" || matchesFoodFilter(place, activeFood))
  );

  const buildHref = (city: string, category: string, tripId = selectedTrip?.id, popular = thaiPopularOnly, food = activeFood) => {
    const params = new URLSearchParams();
    if (tripId) params.set("trip", tripId);
    if (city !== "all") params.set("city", city);
    if (category !== "all") params.set("category", category);
    if (popular) params.set("popular", "thai");
    if (food !== "all") params.set("food", food);
    const qs = params.toString();
    return `/explore${qs ? `?${qs}` : ""}`;
  };
  const returnTo = buildHref(activeCity, activeCategory, selectedTrip?.id, thaiPopularOnly, activeFood);

  return <main className="shell"><div className="container"><AppHeader />
    <section className="discovery-hero">
      <div>
        <span className="eyebrow">V7.9 · EXPLORE → DAY PLAN → ROUTE</span>
        <h1>{selectedTrip ? `Explore · ${selectedTrip.title}` : "Explore Japan"}</h1>
        <p>{selectedTrip ? "ค้นหา ดูพิกัด บันทึก Wishlist หรือเพิ่มลง Day Planner ได้จากหน้าเดียว" : "เลือกทริปก่อน แล้วระบบจะแสดงเฉพาะพื้นที่ที่คุณกำลังจะไป"}</p>
      </div>
      <div className="explore-hero-actions">
        {selectedTrip && <Link className="btn btn-primary" href={`/trips/${selectedTrip.id}/smart-plan`}>Smart Day</Link>}
        {selectedTrip && <Link className="btn btn-secondary" href={`/trips/${selectedTrip.id}/route`}>Trip Route</Link>}
      </div>
    </section>

    {query.saved === "1" && <div className="success-box">บันทึกลง Wishlist แล้ว ✓</div>}
    {query.added === "1" && <div className="success-box">เพิ่มสถานที่ลง Day Planner แล้ว ✓</div>}
    {query.error && <div className="error-box">{query.error}</div>}

    {rows.length > 0 && <section className="section trip-scope-section">
      <div className="section-head"><h2>Explore ตามทริป</h2><span className="small muted">เมืองถูกกำหนดจาก Trip</span></div>
      <div className="trip-scope-row">
        {rows.map((trip) => <Link key={trip.id} href={buildHref("all", "all", trip.id, false, "all")} className={`trip-scope-chip ${selectedTrip?.id === trip.id ? "active" : ""}`}>
          <span>🧳</span><div><strong>{trip.title}</strong><small>{(trip.cities || []).join(" • ") || "ยังไม่ได้เลือกเมือง"}</small></div>
        </Link>)}
      </div>
      {selectedTrip && <div className="trip-destination-summary">
        <div><strong>พื้นที่ของทริปนี้</strong><p>{tripCities.length ? tripCities.join(" → ") : "ยังไม่มีเมืองที่ตรงกับ Explore database"}</p></div>
        {selectedTrip.owner_id === userId && <Link className="link" href={`/trips/${selectedTrip.id}/destinations`}>แก้เมือง ›</Link>}
      </div>}
    </section>}

    <section className="section">
      <div className="section-head"><h2>{selectedTrip ? "เมืองในทริป" : "เลือกเมือง"}</h2><span className="small muted">{filtered.length} สถานที่ · Curated · ¥0 Places API</span></div>
      <div className="filter-chip-row">
        <Link className={`filter-chip ${activeCity === "all" ? "active" : ""}`} href={buildHref("all", activeCategory)}>ทั้งหมด</Link>
        {availableCities.map((city: string) => <Link key={city} className={`filter-chip ${activeCity === city ? "active" : ""}`} href={buildHref(city, activeCategory)}>{city}</Link>)}
      </div>
      <div className="filter-chip-row compact-filter-row">
        <Link className={`filter-chip thai-popular-filter ${thaiPopularOnly ? "active" : ""}`} href={buildHref(activeCity, activeCategory, selectedTrip?.id, !thaiPopularOnly)}>คนไทยนิยม</Link>
        <Link className={`filter-chip ${activeCategory === "all" ? "active" : ""}`} href={buildHref(activeCity, "all", selectedTrip?.id, thaiPopularOnly, "all")}>ทุกประเภท</Link>
        {Object.entries(categoryLabels).map(([key, label]) => <Link key={key} className={`filter-chip ${activeCategory === key ? "active" : ""}`} href={buildHref(activeCity, key, selectedTrip?.id, thaiPopularOnly, "all")}>{label}</Link>)}
      </div>
      {(activeCategory === "food" || activeFood !== "all") && <div className="filter-chip-row food-filter-row">
        {FOOD_FILTERS.map((item) => <Link key={item.id} className={`filter-chip food-filter ${activeFood === item.id ? "active" : ""}`} href={buildHref(activeCity, "food", selectedTrip?.id, thaiPopularOnly, item.id)}>{item.label}</Link>)}
      </div>}
    </section>

    {filtered.length > 0 && <section className="section explore-map-section">
      <div className="section-head"><h2>Explore Map</h2><span className="small muted">แตะหมายเลขเพื่อเปิด Google Maps</span></div>
      <ExploreCoordinateMap places={filtered} />
    </section>}

    {!rows.length && <div className="notice"><span>💡</span><div><strong>สร้างทริปก่อนเพื่อให้ Explore รู้ว่าคุณจะไปไหน</strong><br/><span className="muted">เมืองที่เลือกตอนสร้าง Trip จะกลายเป็นตัวกรองอัตโนมัติ</span><br/><Link className="link" href="/trips/new">สร้างทริปใหม่ ›</Link></div></div>}

    {!filtered.length && <div className="empty-state"><div className="empty-icon">🗺️</div><h2>ยังไม่มีสถานที่ในตัวกรองนี้</h2><p>ลองเปลี่ยนเมือง ประเภท หรือ Food filter</p></div>}

    <section className="explore-grid">
      {filtered.map((place) => {
        const guide = getPlaceGuide(place.slug);
        return <article className="place-card" key={place.slug}>
          <div className="place-card-cover"><span>{place.emoji}</span><div className="place-city-badge">{place.city}</div>{place.thaiPopular && <div className="thai-popular-badge">คนไทยนิยม</div>}</div>
          <div className="place-card-body">
            <div className="place-meta">{place.area} · {categoryLabels[place.category] || place.category}</div>
            <h2>{place.title}</h2>
            {guide.thaiTitle && guide.thaiTitle !== place.title && <div className="place-thai-title">{guide.thaiTitle}</div>}
            <p>{place.summary}</p>
            {place.thaiPopular && place.thaiNote && <div className="thai-popular-note">{place.thaiNote}</div>}
            <div className="tag-row">{place.tags.slice(0,4).map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}</div>
            <div className="place-facts"><span>{place.childFriendly ? "👧 Kids" : "—"}</span><span>{place.seniorFriendly ? "👵 Senior" : "⚠️ เดินเยอะ"}</span><span>{place.isOutdoor ? "🌤 Outdoor" : "🏠 Indoor"}</span><span>⏱ {place.durationMinutes} นาที</span></div>

            {Object.keys(guide).length > 0 && <div className="place-guide-grid">
              {guide.nearestStation && <div><span>สถานีใกล้</span><strong>{guide.nearestStation}</strong>{guide.walkMinutes != null && <small>เดินประมาณ {guide.walkMinutes} นาที</small>}{guide.accessNote && <small>{guide.accessNote}</small>}</div>}
              {guide.hoursNote && <div><span>เวลา</span><strong>{guide.hoursNote}</strong>{guide.closedNote && <small>{guide.closedNote}</small>}</div>}
              {guide.budgetNote && <div><span>งบประมาณ</span><strong>{guide.budgetNote}</strong></div>}
              {guide.reservationNote && <div><span>การจอง</span><strong>{guide.reservationNote}</strong></div>}
              {guide.bestTime && <div><span>ช่วงแนะนำ</span><strong>{guide.bestTime}</strong></div>}
              {guide.familyNote && <div><span>Family note</span><strong>{guide.familyNote}</strong></div>}
            </div>}

            <a className="btn btn-secondary btn-full explore-map-link" href={googleMapsSearchUrl(place.title, place.city)} target="_blank" rel="noreferrer">เปิด Google Maps</a>

            {selectedTrip && selectedTripEditable && selectedDays.length > 0 && <form action={addPlaceToDay} className="explore-add-day-form">
              <input type="hidden" name="place_slug" value={place.slug} />
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="trip_id" value={selectedTrip.id} />
              <select className="select" name="day_id" defaultValue={selectedDays[0]?.id}>{selectedDays.map((day, index) => <option key={day.id} value={day.id}>{dayLabel(day.trip_date, index)}</option>)}</select>
              <SubmitButton className="btn btn-primary" pendingText="กำลังเพิ่ม...">+ เพิ่มลง Day</SubmitButton>
            </form>}

            {selectedTrip ? (
              selectedTripEditable ? <form action={savePlaceToWishlist} className="wishlist-save-form single-action-form">
                <input type="hidden" name="place_slug" value={place.slug} />
                <input type="hidden" name="return_to" value={returnTo} />
                <input type="hidden" name="trip_id" value={selectedTrip.id} />
                <SubmitButton className="btn btn-ghost btn-full" pendingText="กำลังบันทึก...">♡ เก็บไว้ใน Wishlist</SubmitButton>
              </form> : <div className="small muted">Viewer สามารถดูสถานที่ได้ แต่แก้แผนไม่ได้</div>
            ) : editableTrips.length ? <form action={savePlaceToWishlist} className="wishlist-save-form">
              <input type="hidden" name="place_slug" value={place.slug} />
              <input type="hidden" name="return_to" value={returnTo} />
              <select className="select" name="trip_id" defaultValue={editableTrips[0]?.id}>
                {editableTrips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
              </select>
              <SubmitButton className="btn btn-primary" pendingText="กำลังบันทึก...">♡ Wishlist</SubmitButton>
            </form> : <Link href="/trips/new" className="btn btn-primary btn-full">สร้างทริปเพื่อบันทึก</Link>}
          </div>
        </article>;
      })}
    </section>
  </div><BottomNav active="/explore" /></main>;
}
