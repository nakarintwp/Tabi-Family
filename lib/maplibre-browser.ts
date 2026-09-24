"use client";

declare global {
  interface Window {
    maplibregl?: any;
    __tabiMapLibrePromise?: Promise<any>;
  }
}

const MAPLIBRE_JS_SOURCES = [
  "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.js",
];
const MAPLIBRE_CSS_SOURCES = [
  "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css",
];

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function loadMapLibre(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.maplibregl?.Map) return Promise.resolve(window.maplibregl);
  if (window.__tabiMapLibrePromise) return window.__tabiMapLibrePromise;

  window.__tabiMapLibrePromise = new Promise<any>((resolve, reject) => {
    if (!document.querySelector('link[data-tabi-maplibre="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MAPLIBRE_CSS_SOURCES[0];
      link.dataset.tabiMaplibre = "1";
      link.onerror = () => { link.href = MAPLIBRE_CSS_SOURCES[1]; };
      document.head.appendChild(link);
    }

    let sourceIndex = 0;
    const loadScript = () => {
      const old = document.querySelector<HTMLScriptElement>('script[data-tabi-maplibre="1"]');
      old?.remove();

      const script = document.createElement("script");
      script.src = MAPLIBRE_JS_SOURCES[sourceIndex];
      script.async = true;
      script.defer = true;
      script.dataset.tabiMaplibre = "1";
      script.onload = () => {
        if (window.maplibregl?.Map) resolve(window.maplibregl);
        else reject(new Error("MapLibre unavailable after load"));
      };
      script.onerror = () => {
        sourceIndex += 1;
        if (sourceIndex < MAPLIBRE_JS_SOURCES.length) loadScript();
        else reject(new Error("MapLibre failed to load from all CDNs"));
      };
      document.head.appendChild(script);
    };

    loadScript();

    window.setTimeout(() => {
      if (!window.maplibregl?.Map) reject(new Error("MapLibre load timeout"));
    }, 12000);
  }).catch((error) => {
    window.__tabiMapLibrePromise = undefined;
    throw error;
  });

  return window.__tabiMapLibrePromise;
}
