import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { app: "Tabi Family", version: "8.8", feature: "master-booking-budget-rental-today-conflicts-documents-emergency" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
