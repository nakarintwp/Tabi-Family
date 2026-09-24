import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "11.8", feature: "real-photo-gallery-filters-add-to-trip-map-polish-no-snow" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
