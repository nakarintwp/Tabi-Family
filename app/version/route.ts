import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.3.6", feature: "compact-multi-city-picker" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
