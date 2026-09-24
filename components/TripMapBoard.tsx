export type TripMapPoint = {
  id: string;
  title: string;
  subtitle?: string | null;
  latitude: number;
  longitude: number;
  kind: "attraction" | "food" | "shopping" | "hotel" | "transport" | "other";
  mapsUrl?: string | null;
};

const glyph: Record<TripMapPoint["kind"], string> = { attraction: "●", food: "●", shopping: "●", hotel: "●", transport: "●", other: "●" };

function searchUrl(point: TripMapPoint) {
  if (point.mapsUrl) return point.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.subtitle || point.title)}`;
}

export function TripMapBoard({ points }: { points: TripMapPoint[] }) {
  const usable = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (!usable.length) return <div className="map-fallback"><div>📍</div><strong>ยังไม่มีพิกัดในวันนี้</strong><p>เพิ่มสถานที่จาก Explore หรือบันทึกพิกัดใน Day Planner ก่อน</p></div>;
  const lats = usable.map((p) => p.latitude); const lngs = usable.map((p) => p.longitude);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats); const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
  const latSpan = Math.max(0.01, maxLat - minLat); const lngSpan = Math.max(0.01, maxLng - minLng);
  return <div className="trip-map-board">
    <div className="trip-map-board-canvas">
      <span className="map-compass">N</span>
      {usable.map((point, index) => {
        const left = 7 + ((point.longitude - minLng) / lngSpan) * 86;
        const top = 8 + ((maxLat - point.latitude) / latSpan) * 82;
        return <a key={point.id} href={searchUrl(point)} target="_blank" rel="noreferrer" className={`trip-map-board-pin kind-${point.kind}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${index+1}. ${point.title}`}><span>{index+1}</span><i>{glyph[point.kind]}</i></a>;
      })}
    </div>
    <div className="trip-map-board-legend">{usable.map((point,index) => <a key={point.id} href={searchUrl(point)} target="_blank" rel="noreferrer"><b>{index+1}</b><span><strong>{point.title}</strong><small>{point.subtitle || point.kind}</small></span></a>)}</div>
  </div>;
}
