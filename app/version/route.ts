import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.3.8", feature: "text-only-city-picker" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
