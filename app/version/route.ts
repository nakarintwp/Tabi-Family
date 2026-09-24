import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "10.5", feature: "auto-import-smart-link-route-optimizer-map-first-live-status-delay-replanner" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
