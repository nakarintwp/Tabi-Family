"use client";

import { googleMapsSearchUrl, type DiscoveryPlace } from "@/lib/discovery";
import { RealMap, type RealMapPoint } from "@/components/RealMap";

function mapKind(category: string): RealMapPoint["kind"] {
  if (["food", "shopping", "family", "nature", "museum", "attraction"].includes(category)) return category as RealMapPoint["kind"];
  return "other";
}

const kindLabels: Array<[RealMapPoint["kind"], string]> = [
  ["attraction", "เที่ยว"],
  ["food", "อาหาร"],
  ["shopping", "ช้อปปิ้ง"],
  ["nature", "ธรรมชาติ"],
  ["family", "ครอบครัว"],
  ["museum", "พิพิธภัณฑ์"],
];

export function ExploreCoordinateMap({ places }: { places: DiscoveryPlace[] }) {
  const points: RealMapPoint[] = places
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    .slice(0, 80)
    .map((place) => ({
      id: place.slug,
      title: place.title,
      subtitle: `${place.city} · ${place.area}`,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      kind: mapKind(place.category),
      mapsUrl: googleMapsSearchUrl(place.title, place.city),
    }));

  if (!points.length) return <div className="explore-coordinate-empty">ยังไม่มีพิกัดในตัวกรองนี้</div>;

  const visibleKinds = kindLabels.filter(([kind]) => points.some((point) => point.kind === kind));

  return (
    <div className="explore-coordinate-map real-map-card">
      <div className="explore-map-caption">
        <div><strong>Map overview</strong><span>{points.length} จุด · แผนที่จริง · เลื่อน/ซูม · หลายหมุด · เปิดเต็มจอ</span></div>
        <small>OpenStreetMap + Leaflet · ไม่ใช้ API key</small>
      </div>
      <RealMap points={points} className="explore-real-map" />
      <div className="map-kind-legend">
        {visibleKinds.map(([kind, label]) => <span key={kind} className={`map-kind-chip kind-${kind}`}><i />{label}</span>)}
      </div>
      <div className="explore-map-legend real-map-legend">
        {points.slice(0, 12).map((place, index) => (
          <a key={place.id} href={place.mapsUrl || "#"} target="_blank" rel="noreferrer">
            <b>{index + 1}</b><span>{place.title}</span>
          </a>
        ))}
        {points.length > 12 && <span className="muted">+ {points.length - 12} จุดบนแผนที่</span>}
      </div>
    </div>
  );
}
