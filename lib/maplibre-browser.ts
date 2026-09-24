"use client";

/**
 * MapLibre is bundled with the app instead of loaded from a third-party CDN.
 * This avoids blank maps caused by script/CDN blocking and makes Vercel's
 * TypeScript build verify the dependency at deploy time.
 */
export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

let mapLibrePromise: Promise<any> | null = null;

export function loadMapLibre(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MapLibre can only load in the browser"));
  }

  if (!mapLibrePromise) {
    mapLibrePromise = import("maplibre-gl").then((module) => {
      const maplibregl = (module as any).default ?? module;
      if (!maplibregl?.Map) throw new Error("MapLibre module loaded without Map constructor");
      return maplibregl;
    });
  }

  return mapLibrePromise;
}
