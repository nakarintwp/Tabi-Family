import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.3.4", feature: "css-parser-build-fix" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
