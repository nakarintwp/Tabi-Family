"use client";

declare global {
  interface Window {
    maplibregl?: any;
    __tabiMapLibrePromise?: Promise<any>;
  }
}

const MAPLIBRE_SOURCES = [
  {
    js: "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.js",
    css: "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css",
  },
  {
    js: "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js",
    css: "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css",
  },
];

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
} as const;

function ensureCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.tabiMaplibre = "1";
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.maplibregl?.Map) return resolve();
      const timer = window.setTimeout(() => reject(new Error(`MapLibre timeout: ${src}`)), 8000);
      existing.addEventListener("load", () => {
        window.clearTimeout(timer);
        window.maplibregl?.Map ? resolve() : reject(new Error(`MapLibre unavailable: ${src}`));
      }, { once: true });
      existing.addEventListener("error", () => {
        window.clearTimeout(timer);
        reject(new Error(`MapLibre failed: ${src}`));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.tabiMaplibre = "1";
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new Error(`MapLibre timeout: ${src}`));
    }, 8000);
    script.onload = () => {
      window.clearTimeout(timer);
      window.maplibregl?.Map ? resolve() : reject(new Error(`MapLibre unavailable: ${src}`));
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error(`MapLibre failed: ${src}`));
    };
    document.head.appendChild(script);
  });
}

export async function loadMapLibre(): Promise<any> {
  if (typeof window === "undefined") throw new Error("browser only");
  if (window.maplibregl?.Map) return window.maplibregl;
  if (window.__tabiMapLibrePromise) return window.__tabiMapLibrePromise;

  window.__tabiMapLibrePromise = (async () => {
    let lastError: unknown = null;
    for (const source of MAPLIBRE_SOURCES) {
      try {
        ensureCss(source.css);
        await loadScript(source.js);
        if (window.maplibregl?.Map) return window.maplibregl;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("MapLibre failed to load from all CDNs");
  })();

  return window.__tabiMapLibrePromise;
}
