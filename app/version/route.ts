import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.4", feature: "thai-popular-explore" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
