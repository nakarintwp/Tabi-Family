import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "12.1", feature: "map-reliability-leaflet-openstreetmap" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
