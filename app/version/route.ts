import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "12.1", feature: "openfreemap-map-display-height-fix" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
