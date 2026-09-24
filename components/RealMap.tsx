"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadMapLibre, OPENFREEMAP_STYLE } from "@/lib/maplibre-browser";

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

function osmEmbedUrl(points: RealMapPoint[]) {
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

function popupNode(point: RealMapPoint, index: number) {
  const root = document.createElement("div");
  root.className = "tabi-map-popup openfree";

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

  const link = document.createElement("a");
  link.href = point.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "นำทางด้วย Google Maps ↗";
  root.appendChild(link);

  return root;
}

function markerNode(index: number, color: string) {
  const root = document.createElement("button");
  root.type = "button";
  root.className = "tabi-maplibre-marker";
  root.style.setProperty("--pin-color", color);
  root.setAttribute("aria-label", `จุดที่ ${index + 1}`);
  root.dataset.label = String(index + 1);
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
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const boundsRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const usable = useMemo(() => points.filter(validPoint), [points]);

  useEffect(() => {
    if (!containerRef.current || !usable.length) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let loadTimer: ReturnType<typeof window.setTimeout> | null = null;
    setFailed(false);
    setReady(false);

    loadMapLibre()
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: OPENFREEMAP_STYLE,
          center: [usable[0].longitude, usable[0].latitude],
          zoom: usable.length === 1 ? 14.5 : 7.5,
          attributionControl: true,
          cooperativeGestures: !fullscreen,
        });
        mapRef.current = map;
        loadTimer = window.setTimeout(() => {
          if (!cancelled) setFailed(true);
        }, 12000);
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

        const bounds = new maplibregl.LngLatBounds();
        boundsRef.current = bounds;

        markersRef.current = usable.map((point, index) => {
          const lngLat: [number, number] = [point.longitude, point.latitude];
          bounds.extend(lngLat);
          const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setDOMContent(popupNode(point, index));
          return new maplibregl.Marker({ element: markerNode(index, kindColor(point.kind)), anchor: "bottom" })
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map);
        });

        map.on("load", () => {
          if (cancelled) return;
          if (loadTimer) { window.clearTimeout(loadTimer); loadTimer = null; }
          if (connectPoints && usable.length > 1) {
            map.addSource("tabi-route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: usable.map((point) => [point.longitude, point.latitude]),
                },
              },
            });
            map.addLayer({
              id: "tabi-route-line",
              type: "line",
              source: "tabi-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#2f7fa8", "line-width": 4, "line-opacity": 0.72, "line-dasharray": [2, 2] },
            });
          }

          if (usable.length === 1) {
            map.easeTo({ center: [usable[0].longitude, usable[0].latitude], zoom: 14.5, duration: 0 });
          } else {
            map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
          }
          map.resize();
          setReady(true);
        });

        const redraw = () => mapRef.current?.resize?.();
        window.setTimeout(redraw, 100);
        window.setTimeout(redraw, 350);
        if (typeof ResizeObserver !== "undefined" && shellRef.current) {
          resizeObserver = new ResizeObserver(redraw);
          resizeObserver.observe(shellRef.current);
        }
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (loadTimer) window.clearTimeout(loadTimer);
      resizeObserver?.disconnect();
      markersRef.current.forEach((marker) => marker?.remove?.());
      markersRef.current = [];
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
      map.resize();
      if (usable.length === 1) {
        map.easeTo({ center: [usable[0].longitude, usable[0].latitude], zoom: 14.5, duration: 0 });
      } else if (boundsRef.current) {
        map.fitBounds(boundsRef.current, { padding: fullscreen ? 72 : 48, maxZoom: 13, duration: 0 });
      }
    }, 120);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("map-fullscreen-open");
    };
  }, [fullscreen, usable]);

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    if (usable.length === 1) {
      map.easeTo({ center: [usable[0].longitude, usable[0].latitude], zoom: 14.5, duration: 350 });
    } else if (boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: fullscreen ? 72 : 48, maxZoom: 13, duration: 350 });
    }
  }

  if (!usable.length) {
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>📍</div><strong>ยังไม่มีพิกัด</strong><p>เพิ่มสถานที่ที่มีพิกัดก่อน แล้วแผนที่จะปรากฏที่นี่</p></div>;
  }

  if (failed) {
    const first = usable[0];
    const mapsUrl = first.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${first.latitude},${first.longitude}`)}`;
    return (
      <div className={`map-fallback ${compact ? "compact" : ""}`}>
        <iframe className="map-fallback-map" src={osmEmbedUrl(usable)} title="OpenStreetMap fallback" loading="lazy" />
        <strong>แสดงแผนที่สำรอง OpenStreetMap</strong>
        <p>MapLibre/OpenFreeMap โหลดไม่สำเร็จ จึงสลับมาใช้แผนที่สำรองอัตโนมัติ</p>
        <a className="btn btn-secondary btn-sm" href={mapsUrl} target="_blank" rel="noreferrer">เปิด Google Maps ↗</a>
      </div>
    );
  }

  return (
    <div ref={shellRef} className={`real-map-shell openfree-provider ${fullscreen ? "fullscreen" : ""}`}>
      {!ready && <div className="real-map-loading"><span />กำลังโหลดแผนที่…</div>}
      <div ref={containerRef} className={`real-map maplibre-real-map ${compact ? "compact" : ""} ${className}`.trim()} aria-label="แผนที่ OpenFreeMap ของสถานที่ในทริป" />
      <div className="real-map-provider-badge">OpenFreeMap · OpenStreetMap</div>
      <div className="real-map-toolbar" aria-label="เครื่องมือแผนที่">
        <button type="button" onClick={fitAll}>ดูทุกจุด</button>
        <button type="button" onClick={() => setFullscreen((value) => !value)}>{fullscreen ? "ย่อแผนที่" : "เต็มจอ"}</button>
      </div>
    </div>
  );
}
