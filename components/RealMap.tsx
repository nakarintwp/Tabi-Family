"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadMapLibre, OPENFREEMAP_STYLE, OSM_RASTER_STYLE } from "@/lib/maplibre-browser";

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
  const fallbackAppliedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState<"openfree" | "osm">("openfree");
  const [fullscreen, setFullscreen] = useState(false);
  const usable = useMemo(() => points.filter(validPoint), [points]);

  useEffect(() => {
    if (!containerRef.current || !usable.length) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let fallbackTimer = 0;
    setFailed(false);
    setReady(false);
    setProvider("openfree");
    fallbackAppliedRef.current = false;

    loadMapLibre()
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        let map: any;
        try {
          map = new maplibregl.Map({
            container: containerRef.current,
            style: OPENFREEMAP_STYLE,
            center: [usable[0].longitude, usable[0].latitude],
            zoom: usable.length === 1 ? 14.5 : 7.5,
            attributionControl: true,
            cooperativeGestures: !fullscreen,
          });
        } catch (error) {
          console.error("Tabi map init failed", error);
          setFailed(true);
          return;
        }

        mapRef.current = map;
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

        const applyRoute = () => {
          if (!connectPoints || usable.length < 2) return;
          try {
            if (!map.getSource("tabi-route")) {
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
            }
            if (!map.getLayer("tabi-route-line")) {
              map.addLayer({
                id: "tabi-route-line",
                type: "line",
                source: "tabi-route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#2f7fa8", "line-width": 4, "line-opacity": 0.72, "line-dasharray": [2, 2] },
              });
            }
          } catch (error) {
            console.warn("Tabi route overlay skipped", error);
          }
        };

        const finishMap = () => {
          if (cancelled) return;
          applyRoute();
          if (usable.length === 1) {
            map.easeTo({ center: [usable[0].longitude, usable[0].latitude], zoom: 14.5, duration: 0 });
          } else {
            map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
          }
          map.resize();
          setReady(true);
        };

        const applyRasterFallback = (reason: string) => {
          if (cancelled || fallbackAppliedRef.current) return;
          fallbackAppliedRef.current = true;
          console.warn(`Tabi map switching to OSM raster fallback: ${reason}`);
          setProvider("osm");
          try {
            map.setStyle(OSM_RASTER_STYLE as any);
          } catch (error) {
            console.error("Tabi OSM raster fallback failed", error);
            setFailed(true);
          }
        };

        map.on("load", finishMap);
        map.on("style.load", () => {
          if (fallbackAppliedRef.current) finishMap();
        });
        map.on("error", (event: any) => {
          if (!ready && !fallbackAppliedRef.current) {
            const message = String(event?.error?.message || event?.message || "map style error");
            if (/style|source|tile|sprite|glyph|fetch|network|cors/i.test(message)) {
              applyRasterFallback(message);
            }
          }
        });

        fallbackTimer = window.setTimeout(() => {
          if (!cancelled && !ready && !fallbackAppliedRef.current) {
            applyRasterFallback("initial style timeout");
          }
        }, 4500);

        const redraw = () => mapRef.current?.resize?.();
        window.setTimeout(redraw, 120);
        window.setTimeout(redraw, 420);
        if (typeof ResizeObserver !== "undefined" && shellRef.current) {
          resizeObserver = new ResizeObserver(redraw);
          resizeObserver.observe(shellRef.current);
        }
      })
      .catch((error) => {
        console.error("Tabi MapLibre loader failed", error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
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
    return <div className={`map-fallback ${compact ? "compact" : ""}`}><div>⚠️</div><strong>แผนที่โหลดไม่สำเร็จ</strong><p>เครือข่ายอาจบล็อกผู้ให้บริการแผนที่ ลองรีเฟรชอีกครั้ง หรือเปิดจุดแรกใน Google Maps</p><a className="btn btn-secondary btn-sm" href={mapsUrl} target="_blank" rel="noreferrer">เปิด Google Maps ↗</a></div>;
  }

  return (
    <div ref={shellRef} className={`real-map-shell openfree-provider ${fullscreen ? "fullscreen" : ""}`}>
      {!ready && <div className="real-map-loading"><span />กำลังโหลดแผนที่…</div>}
      <div ref={containerRef} className={`real-map maplibre-real-map ${compact ? "compact" : ""} ${className}`.trim()} aria-label="แผนที่สถานที่ในทริป" />
      <div className="real-map-provider-badge">{provider === "openfree" ? "OpenFreeMap · OpenStreetMap" : "OpenStreetMap · fallback mode"}</div>
      <div className="real-map-toolbar" aria-label="เครื่องมือแผนที่">
        <button type="button" onClick={fitAll}>ดูทุกจุด</button>
        <button type="button" onClick={() => setFullscreen((value) => !value)}>{fullscreen ? "ย่อแผนที่" : "เต็มจอ"}</button>
      </div>
    </div>
  );
}
