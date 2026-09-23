"use client";

import { useMemo, useState } from "react";

export type RouteDestination = {
  id: string;
  title: string;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Coords = { latitude: number; longitude: number };

type Props = {
  destinations: RouteDestination[];
  compact?: boolean;
  title?: string;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function straightLineKm(a: Coords, b: Coords) {
  const radius = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function destinationValue(destination: RouteDestination) {
  const lat = Number(destination.latitude);
  const lng = Number(destination.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat},${lng}`;
  return destination.locationName?.trim() || destination.title.trim();
}

function directionsUrl(origin: Coords | null, destination: RouteDestination, travelmode: "transit" | "walking") {
  const params = new URLSearchParams({
    api: "1",
    destination: destinationValue(destination),
    travelmode,
  });
  if (origin) params.set("origin", `${origin.latitude},${origin.longitude}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function CurrentLocationRoute({ destinations, compact = false, title = "Route Map" }: Props) {
  const usable = useMemo(
    () => destinations.filter((item) => Boolean(item.locationName?.trim() || item.title?.trim()) || (Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))),
    [destinations],
  );
  const [selectedId, setSelectedId] = useState(usable[0]?.id || "");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  const selected = usable.find((item) => item.id === selectedId) || usable[0];
  const destinationCoords = selected && Number.isFinite(Number(selected.latitude)) && Number.isFinite(Number(selected.longitude))
    ? { latitude: Number(selected.latitude), longitude: Number(selected.longitude) }
    : null;
  const distance = coords && destinationCoords ? straightLineKm(coords, destinationCoords) : null;

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setStatus("loading");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setStatus("ready");
      },
      (locationError) => {
        setStatus("error");
        if (locationError.code === locationError.PERMISSION_DENIED) setError("ยังไม่ได้อนุญาต Location ให้เว็บไซต์ กรุณาอนุญาตแล้วลองใหม่");
        else if (locationError.code === locationError.TIMEOUT) setError("อ่านตำแหน่งไม่ทันเวลา กรุณาลองใหม่ในพื้นที่ที่รับ GPS ได้ดีขึ้น");
        else setError("ไม่สามารถอ่านตำแหน่งปัจจุบันได้ กรุณาลองใหม่");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  if (!selected) {
    return <div className={`current-route-card ${compact ? "compact" : ""}`}><div className="current-route-empty">📍 ยังไม่มีสถานที่ปลายทางในวันนี้</div></div>;
  }

  return (
    <section className={`current-route-card ${compact ? "compact" : ""}`}>
      <div className="current-route-head">
        <div><span className="route-kicker">Current location → destination</span><h3>{title}</h3></div>
        <span className="zero-badge">¥0 API</span>
      </div>

      {usable.length > 1 && (
        <label className="route-destination-select">
          <span>ปลายทาง</span>
          <select className="select" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
            {usable.map((destination) => <option value={destination.id} key={destination.id}>{destination.title}{destination.locationName ? ` · ${destination.locationName}` : ""}</option>)}
          </select>
        </label>
      )}

      <div className="route-points">
        <div className="route-point origin">
          <div className="route-point-icon">🟢</div>
          <div><strong>ตำแหน่งปัจจุบันของคุณ</strong>{coords ? <small>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</small> : <small>ใช้ GPS/Location จากมือถือเมื่อคุณอนุญาต</small>}</div>
        </div>
        <div className="route-connector"><span>↓</span>{distance !== null && <b>เส้นตรง ~{distance < 1 ? `${Math.round(distance * 1000)} ม.` : `${distance.toFixed(1)} กม.`}</b>}</div>
        <div className="route-point destination">
          <div className="route-point-icon">🔵</div>
          <div><strong>{selected.title}</strong><small>{selected.locationName || (destinationCoords ? `${destinationCoords.latitude.toFixed(5)}, ${destinationCoords.longitude.toFixed(5)}` : "ปลายทาง")}</small></div>
        </div>
      </div>

      {status !== "ready" && (
        <button type="button" className="btn btn-primary btn-full location-button" onClick={requestLocation} disabled={status === "loading"}>
          {status === "loading" ? "กำลังอ่านตำแหน่ง..." : "📍 ใช้ตำแหน่งปัจจุบัน"}
        </button>
      )}

      {status === "error" && <div className="route-error">{error}</div>}

      <div className="route-actions">
        <a className="btn btn-secondary" target="_blank" rel="noreferrer" href={directionsUrl(coords, selected, "transit")}>🚆 ขนส่งสาธารณะ</a>
        <a className="btn btn-secondary" target="_blank" rel="noreferrer" href={directionsUrl(coords, selected, "walking")}>🚶 เดิน</a>
      </div>
      <p className="route-footnote">ไม่ใช้ Google Maps API — เปิด Google Maps ผ่าน URL โดยตรง หากไม่อนุญาต Location Google Maps จะเลือกต้นทางปัจจุบันให้เมื่อแอปรองรับ</p>
    </section>
  );
}
