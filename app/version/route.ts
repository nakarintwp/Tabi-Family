import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "8.9", feature: "auto-linked-private-trip-documents" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
