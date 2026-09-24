import { googleMapsSearchUrl, type DiscoveryPlace } from "@/lib/discovery";

const categoryClass: Record<string, string> = {
  food: "food",
  shopping: "shopping",
  attraction: "attraction",
  family: "family",
  nature: "nature",
  museum: "museum",
};

export function ExploreCoordinateMap({ places }: { places: DiscoveryPlace[] }) {
  const points = places.filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  if (!points.length) {
    return <div className="explore-coordinate-empty">ยังไม่มีพิกัดในตัวกรองนี้</div>;
  }

  const lats = points.map((p) => Number(p.latitude));
  const lngs = points.map((p) => Number(p.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.02);
  const lngSpan = Math.max(maxLng - minLng, 0.02);

  return (
    <div className="explore-coordinate-map" aria-label="Explore location overview">
      <div className="explore-map-caption"><strong>Map overview</strong><span>พิกัดโดยประมาณ · ¥0 Map API</span></div>
      <div className="explore-map-grid">
        {points.slice(0, 28).map((place, index) => {
          const left = 7 + ((Number(place.longitude) - minLng) / lngSpan) * 86;
          const top = 7 + ((maxLat - Number(place.latitude)) / latSpan) * 78;
          return (
            <a
              key={place.slug}
              className={`explore-map-pin ${categoryClass[place.category] || "attraction"}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              href={googleMapsSearchUrl(place.title, place.city)}
              target="_blank"
              rel="noreferrer"
              title={`${place.title} · ${place.city}`}
              aria-label={`เปิด ${place.title} ใน Google Maps`}
            >
              <span>{index + 1}</span>
            </a>
          );
        })}
        <div className="explore-map-axis north">N</div>
      </div>
      <div className="explore-map-legend">
        {points.slice(0, 8).map((place, index) => <span key={place.slug}><b>{index + 1}</b>{place.title}</span>)}
        {points.length > 8 && <span className="muted">+ {points.length - 8} จุด</span>}
      </div>
    </div>
  );
}
