"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadMapLibre, OPENFREEMAP_STYLE } from "@/lib/maplibre-browser";

type Point = { id: string; title: string; latitude: number; longitude: number; label?: string };

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
      markers.forEach((marker) => marker?.remove?.());
      instanceRef.current?.remove?.();
      instanceRef.current = null;
    };
  }, [usable]);

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>🗺️</div><strong>ยังไม่มีพิกัด</strong><p>เพิ่มพิกัดสถานที่ใน Day Planner แล้วแผนที่จะปรากฏที่นี่</p></div>;
  }
  if (failed) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>⚠️</div><strong>แผนที่โหลดไม่สำเร็จ</strong><p>ลองรีเฟรชอีกครั้ง</p></div>;
  }
  return <div ref={mapRef} className={compact ? "google-map compact maplibre-map" : "google-map maplibre-map"} aria-label="Trip map" />;
}
