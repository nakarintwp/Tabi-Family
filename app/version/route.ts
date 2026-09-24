import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "11.2", feature: "expense-backup-ocr-inbox-smart-engine-weather-driving-intelligence" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
