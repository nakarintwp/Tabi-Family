"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __tabiGoogleMapsMapPromise?: Promise<void>;
  }
}

type Point = { id: string; title: string; latitude: number; longitude: number; label?: string };

function loadMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();
  if (window.__tabiGoogleMapsMapPromise) return window.__tabiGoogleMapsMapPromise;
  window.__tabiGoogleMapsMapPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-tabi-google-maps="1"]');
    if (existing) {
      if (window.google?.maps) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.tabiGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed"));
    document.head.appendChild(script);
  });
  return window.__tabiGoogleMapsMapPromise;
}

export function TripMap({ apiKey, points, compact = false }: { apiKey?: string; points: Point[]; compact?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const usable = useMemo(() => points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)), [points]);

  useEffect(() => {
    if (!apiKey || !mapRef.current || !usable.length) return;
    let cancelled = false;
    loadMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) return;
        const center = usable[0];
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: usable.length === 1 ? 14 : 11,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        const bounds = new window.google.maps.LatLngBounds();
        usable.forEach((point, index) => {
          const position = { lat: point.latitude, lng: point.longitude };
          bounds.extend(position);
          const marker = new window.google.maps.Marker({ map, position, label: String(index + 1), title: point.title });
          const info = new window.google.maps.InfoWindow({ content: `<strong>${point.title.replace(/[<>]/g, "")}</strong>${point.label ? `<br><small>${point.label.replace(/[<>]/g, "")}</small>` : ""}` });
          marker.addListener("click", () => info.open({ map, anchor: marker }));
        });
        if (usable.length > 1) {
          new window.google.maps.Polyline({ map, path: usable.map((p) => ({ lat: p.latitude, lng: p.longitude })), geodesic: true, strokeOpacity: 0.65, strokeWeight: 4 });
          map.fitBounds(bounds, 44);
        }
      })
      .catch(() => setFailed(true));
    return () => { cancelled = true; };
  }, [apiKey, usable]);

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>🗺️</div><strong>ยังไม่มีพิกัด</strong><p>ค้นหาสถานที่ด้วย Google Places ใน Day Planner แล้วแผนที่จะปรากฏที่นี่</p></div>;
  }
  if (!apiKey || failed) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>📍</div><strong>{usable.length} จุดมีพิกัดแล้ว</strong><p>เพิ่ม <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> ใน Vercel เพื่อแสดง Google Map</p></div>;
  }
  return <div ref={mapRef} className={compact ? "google-map compact" : "google-map"} aria-label="Trip map" />;
}
