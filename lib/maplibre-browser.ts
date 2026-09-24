"use client";

export const OPENSTREETMAP_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export async function loadMapLibre(): Promise<any> {
  if (typeof window === "undefined") throw new Error("browser only");
  const mod: any = await import("maplibre-gl");
  return mod.default?.Map ? mod.default : mod;
}
