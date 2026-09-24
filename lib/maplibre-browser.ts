"use client";

declare global {
  interface Window {
    maplibregl?: any;
    __tabiMapLibrePromise?: Promise<any>;
  }
}

const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js";
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css";

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function loadMapLibre(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.maplibregl?.Map) return Promise.resolve(window.maplibregl);
  if (window.__tabiMapLibrePromise) return window.__tabiMapLibrePromise;

  window.__tabiMapLibrePromise = new Promise<any>((resolve, reject) => {
    if (!document.querySelector('link[data-tabi-maplibre="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MAPLIBRE_CSS;
      link.dataset.tabiMaplibre = "1";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-tabi-maplibre="1"]');
    if (existing) {
      if (window.maplibregl?.Map) return resolve(window.maplibregl);
      existing.addEventListener("load", () => resolve(window.maplibregl), { once: true });
      existing.addEventListener("error", () => reject(new Error("MapLibre failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.defer = true;
    script.dataset.tabiMaplibre = "1";
    script.onload = () => {
      if (window.maplibregl?.Map) resolve(window.maplibregl);
      else reject(new Error("MapLibre unavailable after load"));
    };
    script.onerror = () => reject(new Error("MapLibre failed to load"));
    document.head.appendChild(script);
  });

  return window.__tabiMapLibrePromise;
}
