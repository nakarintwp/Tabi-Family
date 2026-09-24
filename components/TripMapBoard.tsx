import { RealMap, type RealMapPoint } from "@/components/RealMap";

export type TripMapPoint = {
  id: string;
  title: string;
  subtitle?: string | null;
  latitude: number;
  longitude: number;
  kind: "attraction" | "food" | "shopping" | "hotel" | "transport" | "other";
  mapsUrl?: string | null;
};

function searchUrl(point: TripMapPoint) {
  if (point.mapsUrl) return point.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.subtitle || point.title)}`;
}

export function TripMapBoard({ points }: { points: TripMapPoint[] }) {
  const usable = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (!usable.length) return <div className="map-fallback"><div>📍</div><strong>ยังไม่มีพิกัดในวันนี้</strong><p>เพิ่มสถานที่จาก Explore หรือบันทึกพิกัดใน Day Planner ก่อน</p></div>;

  const mapPoints: RealMapPoint[] = usable.map((point) => ({ ...point, mapsUrl: searchUrl(point) }));

  return <div className="trip-map-board real-trip-map-board">
    <div>
      <RealMap points={mapPoints} connectPoints className="trip-real-map" />
      <p className="map-route-note">เส้นประเชื่อมตามลำดับรายการในวันนั้นเพื่อดูภาพรวม ไม่ใช่เส้นทางนำทางจริง</p>
    </div>
    <div className="trip-map-board-legend">
      {usable.map((point,index) => <a key={point.id} href={searchUrl(point)} target="_blank" rel="noreferrer"><b>{index+1}</b><span><strong>{point.title}</strong><small>{point.subtitle || point.kind}</small></span></a>)}
    </div>
  </div>;
}
