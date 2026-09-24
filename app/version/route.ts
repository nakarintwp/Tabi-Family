import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "9.7", feature: "smart-dashboard-timeline-alerts-offline-family-cost-driving-place-intelligence" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
