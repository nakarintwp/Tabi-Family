import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "12.2", feature: "bundled-maplibre-openfreemap-build-fix" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
