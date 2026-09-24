import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "11.4", feature: "real-interactive-openstreetmap-overview" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
