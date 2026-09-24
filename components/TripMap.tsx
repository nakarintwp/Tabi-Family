"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadMapLibre, OPENFREEMAP_STYLE } from "@/lib/maplibre-browser";

type Point = { id: string; title: string; latitude: number; longitude: number; label?: string };

function osmEmbedUrl(points: Point[]) {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.012);
  const lngPad = Math.max((maxLng - minLng) * 0.18, 0.012);
  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
  const marker = points.length === 1 ? `&marker=${points[0].latitude},${points[0].longitude}` : "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
}

function markerNode(index: number) {
  const root = document.createElement("button");
  root.type = "button";
  root.className = "tabi-maplibre-marker";
  root.style.setProperty("--pin-color", "#2f7fa8");
  root.dataset.label = String(index + 1);
  return root;
}

function popupNode(point: Point) {
  const root = document.createElement("div");
  root.className = "tabi-map-popup openfree";
  const title = document.createElement("strong");
  title.textContent = point.title;
  root.appendChild(title);
  if (point.label) {
    const label = document.createElement("small");
    label.textContent = point.label;
    root.appendChild(label);
  }
  return root;
}

export function TripMap({ points, compact = false }: { apiKey?: string; points: Point[]; compact?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const usable = useMemo(() => points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)), [points]);

  useEffect(() => {
    if (!mapRef.current || !usable.length) return;
    let cancelled = false;
    let loadTimer: ReturnType<typeof window.setTimeout> | null = null;
    const markers: any[] = [];

    loadMapLibre()
      .then((maplibregl) => {
        if (cancelled || !mapRef.current) return;
        const map = new maplibregl.Map({
          container: mapRef.current,
          style: OPENFREEMAP_STYLE,
          center: [usable[0].longitude, usable[0].latitude],
          zoom: usable.length === 1 ? 14 : 10,
          attributionControl: true,
        });
        instanceRef.current = map;
        loadTimer = window.setTimeout(() => {
          if (!cancelled) setFailed(true);
        }, 12000);
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        const bounds = new maplibregl.LngLatBounds();

        usable.forEach((point, index) => {
          const lngLat: [number, number] = [point.longitude, point.latitude];
          bounds.extend(lngLat);
          const popup = new maplibregl.Popup({ offset: 20 }).setDOMContent(popupNode(point));
          markers.push(new maplibregl.Marker({ element: markerNode(index), anchor: "bottom" }).setLngLat(lngLat).setPopup(popup).addTo(map));
        });

        map.on("load", () => {
          if (cancelled) return;
          if (loadTimer) { window.clearTimeout(loadTimer); loadTimer = null; }
          if (usable.length > 1) {
            map.addSource("trip-route", {
              type: "geojson",
              data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: usable.map((p) => [p.longitude, p.latitude]) } },
            });
            map.addLayer({
              id: "trip-route-line",
              type: "line",
              source: "trip-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#2f7fa8", "line-width": 4, "line-opacity": 0.65, "line-dasharray": [2, 2] },
            });
            map.fitBounds(bounds, { padding: 44, maxZoom: 13, duration: 0 });
          }
          map.resize();
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (loadTimer) window.clearTimeout(loadTimer);
      markers.forEach((marker) => marker?.remove?.());
      instanceRef.current?.remove?.();
      instanceRef.current = null;
    };
  }, [usable]);

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>🗺️</div><strong>ยังไม่มีพิกัด</strong><p>เพิ่มพิกัดสถานที่ใน Day Planner แล้วแผนที่จะปรากฏที่นี่</p></div>;
  }
  if (failed) {
    return (
      <div className={`map-fallback ${compact ? "compact" : ""}`}>
        <iframe className="map-fallback-map" src={osmEmbedUrl(usable)} title="Trip map fallback" loading="lazy" />
        <strong>แสดงแผนที่สำรอง OpenStreetMap</strong>
        <p>MapLibre/OpenFreeMap โหลดไม่สำเร็จ จึงสลับมาใช้แผนที่สำรองอัตโนมัติ</p>
      </div>
    );
  }
  return <div ref={mapRef} className={compact ? "google-map compact maplibre-map" : "google-map maplibre-map"} aria-label="Trip map" />;
}
