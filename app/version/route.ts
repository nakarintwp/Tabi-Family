import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "12.0", feature: "zero-billing-openfreemap-maplibre" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
