"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
    __tabiLeafletPromise?: Promise<void>;
  }
}

export type RealMapPoint = {
  id: string;
  title: string;
  subtitle?: string | null;
  latitude: number;
  longitude: number;
  kind?: "attraction" | "food" | "shopping" | "hotel" | "transport" | "family" | "nature" | "museum" | "other";
  mapsUrl?: string | null;
};

function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.L?.map) return Promise.resolve();
  if (window.__tabiLeafletPromise) return window.__tabiLeafletPromise;

  window.__tabiLeafletPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector('link[data-tabi-leaflet="1"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.integrity = "sha256-p4NxAoJBhIINfQ3ynJb+qTjoES6tW6zv1lP+Y8mZkWA=";
      css.crossOrigin = "anonymous";
      css.dataset.tabiLeaflet = "1";
      document.head.appendChild(css);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-tabi-leaflet="1"]');
    if (existing) {
      if (window.L?.map) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.defer = true;
    script.dataset.tabiLeaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });

  return window.__tabiLeafletPromise;
}

function validPoint(point: RealMapPoint) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function popupNode(point: RealMapPoint, index: number) {
  const root = document.createElement("div");
  root.className = "tabi-map-popup";

  const eyebrow = document.createElement("div");
  eyebrow.className = "tabi-map-popup-number";
  eyebrow.textContent = `จุดที่ ${index + 1}`;
  root.appendChild(eyebrow);

  const title = document.createElement("strong");
  title.textContent = point.title;
  root.appendChild(title);

  if (point.subtitle) {
    const subtitle = document.createElement("small");
    subtitle.textContent = point.subtitle;
    root.appendChild(subtitle);
  }

  if (point.mapsUrl) {
    const link = document.createElement("a");
    link.href = point.mapsUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "เปิดใน Google Maps ↗";
    root.appendChild(link);
  }

  return root;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const usable = useMemo(() => points.filter(validPoint), [points]);

  useEffect(() => {
    if (!containerRef.current || !usable.length) return;
    let cancelled = false;
    let map: any = null;

    loadLeaflet()
      .then(() => {
        if (cancelled || !containerRef.current || !window.L?.map) return;
        const L = window.L;
        map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
          tap: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        const bounds = L.latLngBounds([]);
        usable.forEach((point, index) => {
          const latlng = [point.latitude, point.longitude];
          bounds.extend(latlng);
          const kind = point.kind || "other";
          const icon = L.divIcon({
            className: "tabi-leaflet-icon-wrap",
            html: `<div class="tabi-leaflet-pin kind-${kind}"><span>${index + 1}</span></div>`,
            iconSize: [34, 40],
            iconAnchor: [17, 38],
            popupAnchor: [0, -34],
          });
          L.marker(latlng, { icon, title: point.title }).addTo(map).bindPopup(popupNode(point, index));
        });

        if (connectPoints && usable.length > 1) {
          L.polyline(
            usable.map((point) => [point.latitude, point.longitude]),
            { color: "#2f7fa8", weight: 4, opacity: 0.72, dashArray: "9 7" },
          ).addTo(map);
        }

        if (usable.length === 1) {
          map.setView([usable[0].latitude, usable[0].longitude], 15);
        } else {
          map.fitBounds(bounds, { padding: [34, 34], maxZoom: 15 });
        }

        window.setTimeout(() => map?.invalidateSize?.(), 120);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [connectPoints, usable]);

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>📍</div><strong>ยังไม่มีพิกัด</strong><p>เพิ่มสถานที่ที่มีพิกัดก่อน แล้วแผนที่จริงจะแสดงที่นี่</p></div>;
  }

  if (failed) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>🗺️</div><strong>โหลดแผนที่ไม่สำเร็จ</strong><p>ลองเชื่อมต่ออินเทอร์เน็ตแล้วรีเฟรชอีกครั้ง รายชื่อสถานที่ด้านล่างยังเปิด Google Maps ได้ตามปกติ</p></div>;
  }

  return <div ref={containerRef} className={`real-map ${compact ? "compact" : ""} ${className}`.trim()} aria-label="แผนที่จริงของสถานที่ในทริป" />;
}
