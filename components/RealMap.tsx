"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type RealMapPoint = {
  id: string;
  title: string;
  subtitle?: string | null;
  latitude: number;
  longitude: number;
  kind?: "attraction" | "food" | "shopping" | "hotel" | "transport" | "family" | "nature" | "museum" | "other";
  mapsUrl?: string | null;
};

function validPoint(point: RealMapPoint) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function kindColor(kind: RealMapPoint["kind"]) {
  switch (kind) {
    case "food": return "#e77747";
    case "shopping": return "#9b72d2";
    case "hotel": return "#4f8b69";
    case "transport": return "#516fae";
    case "family": return "#e5a92f";
    case "nature": return "#55a86b";
    case "museum": return "#777f91";
    case "attraction": return "#2f7fa8";
    default: return "#607d8b";
  }
}

function popupHtml(point: RealMapPoint, index: number) {
  const title = point.title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
  const subtitle = (point.subtitle || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
  const mapsUrl = point.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
  return `<div class="tabi-map-popup leaflet-popup-body"><div class="tabi-map-popup-number">จุดที่ ${index + 1}</div><strong>${title}</strong>${subtitle ? `<small>${subtitle}</small>` : ""}<a href="${mapsUrl}" target="_blank" rel="noreferrer">นำทางด้วย Google Maps ↗</a></div>`;
}

function markerHtml(index: number, color: string) {
  return `<span class="tabi-leaflet-marker" style="--pin-color:${color}"><b>${index + 1}</b></span>`;
}

export function RealMap({
  points,
  connectPoints = false,
  compact = false,
  className = "",
}: {
  points: RealMapPoint[];
  connectPoints?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const boundsRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const usable = useMemo(() => points.filter(validPoint), [points]);

  useEffect(() => {
    if (!containerRef.current || !usable.length) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let readyTimer: number | null = null;

    setFailed(false);
    setReady(false);

    async function boot() {
      try {
        const L = await import("leaflet");
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          preferCanvas: true,
        });
        mapRef.current = map;

        const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          minZoom: 2,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          crossOrigin: true,
        });

        tileLayer.on("tileerror", () => {
          // Keep the map interactive even if a single tile temporarily fails.
          // The loading timeout below handles a fully unavailable tile service.
        });
        tileLayer.addTo(map);

        const bounds = L.latLngBounds([]);
        boundsRef.current = bounds;

        usable.forEach((point, index) => {
          const latLng = L.latLng(point.latitude, point.longitude);
          bounds.extend(latLng);
          const icon = L.divIcon({
            className: "tabi-leaflet-div-icon",
            html: markerHtml(index, kindColor(point.kind)),
            iconSize: [34, 42],
            iconAnchor: [17, 40],
            popupAnchor: [0, -34],
          });
          L.marker(latLng, { icon, title: point.title })
            .bindPopup(popupHtml(point, index), { maxWidth: 280 })
            .addTo(map);
        });

        if (connectPoints && usable.length > 1) {
          L.polyline(usable.map((point) => [point.latitude, point.longitude] as [number, number]), {
            color: "#2f7fa8",
            weight: 4,
            opacity: 0.72,
            dashArray: "8 8",
          }).addTo(map);
        }

        if (usable.length === 1) {
          map.setView([usable[0].latitude, usable[0].longitude], 14);
        } else {
          map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
        }

        const redraw = () => mapRef.current?.invalidateSize?.({ pan: false });
        window.setTimeout(redraw, 80);
        window.setTimeout(redraw, 280);
        window.setTimeout(redraw, 700);

        if (typeof ResizeObserver !== "undefined" && shellRef.current) {
          resizeObserver = new ResizeObserver(redraw);
          resizeObserver.observe(shellRef.current);
        }

        map.whenReady(() => {
          if (cancelled) return;
          redraw();
          setReady(true);
        });

        readyTimer = window.setTimeout(() => {
          if (!cancelled && mapRef.current) {
            redraw();
            setReady(true);
          }
        }, 2500);
      } catch (error) {
        console.error("Tabi map failed to load", error);
        if (!cancelled) setFailed(true);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (readyTimer) window.clearTimeout(readyTimer);
      resizeObserver?.disconnect();
      mapRef.current?.remove?.();
      mapRef.current = null;
      boundsRef.current = null;
    };
  }, [connectPoints, usable]);

  useEffect(() => {
    document.body.classList.toggle("map-fullscreen-open", fullscreen);
    const timer = window.setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      map.invalidateSize({ pan: false });
      if (usable.length === 1) {
        map.setView([usable[0].latitude, usable[0].longitude], 14, { animate: false });
      } else if (boundsRef.current?.isValid?.()) {
        map.fitBounds(boundsRef.current, { padding: fullscreen ? [64, 64] : [42, 42], maxZoom: 13, animate: false });
      }
    }, 160);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("map-fullscreen-open");
    };
  }, [fullscreen, usable]);

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize({ pan: false });
    if (usable.length === 1) {
      map.setView([usable[0].latitude, usable[0].longitude], 14);
    } else if (boundsRef.current?.isValid?.()) {
      map.fitBounds(boundsRef.current, { padding: fullscreen ? [64, 64] : [42, 42], maxZoom: 13 });
    }
  }

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>📍</div><strong>ยังไม่มีพิกัด</strong><p>เพิ่มสถานที่ที่มีพิกัดก่อน แล้วแผนที่จะปรากฏที่นี่</p></div>;
  }

  if (failed) {
    const first = usable[0];
    const mapsUrl = first.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${first.latitude},${first.longitude}`)}`;
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>⚠️</div><strong>แผนที่โหลดไม่สำเร็จ</strong><p>ลองรีเฟรชอีกครั้ง หรือเปิดจุดแรกใน Google Maps</p><a className="btn btn-secondary btn-sm" href={mapsUrl} target="_blank" rel="noreferrer">เปิด Google Maps ↗</a></div>;
  }

  return (
    <div ref={shellRef} className={`real-map-shell leaflet-provider ${fullscreen ? "fullscreen" : ""}`}>
      {!ready && <div className="real-map-loading"><span />กำลังโหลดแผนที่…</div>}
      <div ref={containerRef} className={`real-map leaflet-real-map ${compact ? "compact" : ""} ${className}`.trim()} aria-label="แผนที่ OpenStreetMap ของสถานที่ในทริป" />
      <div className="real-map-provider-badge">OpenStreetMap · Leaflet</div>
      <div className="real-map-toolbar" aria-label="เครื่องมือแผนที่">
        <button type="button" onClick={fitAll}>ดูทุกจุด</button>
        <button type="button" onClick={() => setFullscreen((value) => !value)}>{fullscreen ? "ย่อแผนที่" : "เต็มจอ"}</button>
      </div>
    </div>
  );
}
