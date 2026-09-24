"use client";

import { googleMapsSearchUrl, type DiscoveryPlace } from "@/lib/discovery";
import { RealMap, type RealMapPoint } from "@/components/RealMap";

function mapKind(category: string): RealMapPoint["kind"] {
  if (["food", "shopping", "family", "nature", "museum", "attraction"].includes(category)) return category as RealMapPoint["kind"];
  return "other";
}

export function ExploreCoordinateMap({ places }: { places: DiscoveryPlace[] }) {
  const points: RealMapPoint[] = places
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    .slice(0, 60)
    .map((place) => ({
      id: place.slug,
      title: place.title,
      subtitle: place.city,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      kind: mapKind(place.category),
      mapsUrl: googleMapsSearchUrl(place.title, place.city),
    }));

  if (!points.length) return <div className="explore-coordinate-empty">ยังไม่มีพิกัดในตัวกรองนี้</div>;

  return (
    <div className="explore-coordinate-map real-map-card">
      <div className="explore-map-caption">
        <div><strong>Map overview</strong><span>แผนที่จริง · เลื่อน/ซูม/แตะหมุดได้</span></div>
        <small>OpenStreetMap · ไม่ต้องใช้ API key</small>
      </div>
      <RealMap points={points} className="explore-real-map" />
      <div className="explore-map-legend real-map-legend">
        {points.slice(0, 10).map((place, index) => (
          <a key={place.id} href={place.mapsUrl || "#"} target="_blank" rel="noreferrer">
            <b>{index + 1}</b><span>{place.title}</span>
          </a>
        ))}
        {points.length > 10 && <span className="muted">+ {points.length - 10} จุดบนแผนที่</span>}
      </div>
    </div>
  );
}
