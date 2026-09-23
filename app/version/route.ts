import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "7.3.3", feature: "deploy-snow-css-build-fix" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
