import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "11.3", feature: "navigation-ux-consolidation-five-hubs" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
