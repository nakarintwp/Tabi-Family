import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.9", feature: "explore-smart-route-rental" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
