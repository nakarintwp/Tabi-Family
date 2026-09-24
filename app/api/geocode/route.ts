import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CacheEntry = { expiresAt: number; rows: unknown[] };
const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2 || q.length > 120) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  const key = q.toLocaleLowerCase("en");
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.rows, cached: true });
  }

  const waitMs = Math.max(0, 1050 - (Date.now() - lastRequestAt));
  if (waitMs) await sleep(waitMs);
  lastRequestAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${q}, Japan`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("limit", "6");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TabiFamily/12.1 (+https://tabi-family.vercel.app)",
        "Referer": "https://tabi-family.vercel.app/",
        "Accept-Language": "th,en,ja",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const raw = (await response.json()) as Array<Record<string, unknown>>;
    const results = raw.map((item) => ({
      id: String(item.place_id ?? `${item.lat}-${item.lon}`),
      name: String(item.display_name ?? q),
      lat: Number(item.lat),
      lng: Number(item.lon),
      type: String(item.type ?? "place"),
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    cache.set(key, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, rows: results });
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json({ results: [], error: "search_unavailable" }, { status: 502 });
  }
}
