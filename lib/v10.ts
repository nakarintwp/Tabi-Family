export type ImportedBookingDraft = {
  bookingType: "flight" | "hotel" | "train" | "bus" | "rental_car" | "restaurant" | "ticket" | "other";
  title: string;
  provider: string;
  referenceCode: string;
  startAt: string;
  endAt: string;
  amount: string;
  currency: "JPY" | "THB" | "USD";
  origin: string;
  destination: string;
  confidence: number;
  evidence: string[];
};

export type OptimizableActivity = {
  id: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  sort_order?: number | null;
  start_time?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
};

function clean(input: string) {
  return input.replace(/\u0000/g, " ").replace(/[\t ]+/g, " ").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function toIsoLocal(date: string, time = "12:00") {
  if (!date) return "";
  return `${date}T${time}`;
}

function findDate(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.]([0-2]?\d|3[01])\b/);
  if (iso) return `${iso[1]}-${String(Number(iso[2])).padStart(2, "0")}-${String(Number(iso[3])).padStart(2, "0")}`;
  const jp = text.match(/\b(20\d{2})年\s*(0?[1-9]|1[0-2])月\s*([0-2]?\d|3[01])日/);
  if (jp) return `${jp[1]}-${String(Number(jp[2])).padStart(2, "0")}-${String(Number(jp[3])).padStart(2, "0")}`;
  const dmy = text.match(/\b([0-2]?\d|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/);
  if (dmy) return `${dmy[3]}-${String(Number(dmy[2])).padStart(2, "0")}-${String(Number(dmy[1])).padStart(2, "0")}`;
  return "";
}

function findTime(text: string) {
  const labeled = text.match(/(?:check[ -]?in|departure|depart|pickup|pick[ -]?up|start|time|เวลา|ออกเดินทาง|รับรถ)\s*[:：-]?\s*([0-2]?\d:[0-5]\d)/i);
  if (labeled?.[1]) return labeled[1].padStart(5, "0");
  const any = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return any ? `${String(Number(any[1])).padStart(2, "0")}:${any[2]}` : "12:00";
}

function inferType(text: string) {
  const t = text.toLowerCase();
  const tests: Array<[ImportedBookingDraft["bookingType"], RegExp]> = [
    ["rental_car", /(rent[ -]?a[ -]?car|rental car|toyota rent|nippon rent|times car|orix rent|รถเช่า|รับรถ|คืนรถ)/i],
    ["flight", /(flight|airline|boarding|departure airport|arrival airport|pnr|e-ticket|เที่ยวบิน|สายการบิน)/i],
    ["hotel", /(hotel|ryokan|check[ -]?in|check[ -]?out|accommodation|room|โรงแรม|ที่พัก|เรียวกัง)/i],
    ["train", /(shinkansen|jr |rail|train|seat reservation|รถไฟ|ชินคันเซ็น)/i],
    ["bus", /(highway bus|bus ticket|bus reservation|รถบัส|รถโดยสาร)/i],
    ["restaurant", /(restaurant|table|dinner|lunch|reservation time|ร้านอาหาร|โต๊ะ|มื้อเย็น|มื้อกลางวัน)/i],
    ["ticket", /(ticket|admission|theme park|museum|pass|voucher|ตั๋ว|บัตรเข้า)/i],
  ];
  for (const [type, pattern] of tests) if (pattern.test(t)) return type;
  return "other" as const;
}

function typeLabel(type: ImportedBookingDraft["bookingType"]) {
  return type === "flight" ? "Flight" : type === "hotel" ? "Hotel" : type === "train" ? "Train" : type === "bus" ? "Bus" : type === "rental_car" ? "Rental car" : type === "restaurant" ? "Restaurant" : type === "ticket" ? "Ticket" : "Booking";
}

export function inferBookingDraft(rawText: string, fileName = "", tripCities: string[] = []): ImportedBookingDraft {
  const rawClean = clean(rawText);
  const text = clean(`${rawClean}\n${fileName}`);
  const bookingType = inferType(text);
  const evidence: string[] = [];
  let confidence = 25;
  if (bookingType !== "other") { confidence += 25; evidence.push(`พบคำที่สื่อถึง ${typeLabel(bookingType)}`); }

  const referenceCode = firstMatch(text, [
    /(?:booking|confirmation|reservation|reference|ref|pnr|เลขจอง|เลขที่จอง|รหัสการจอง)\s*(?:no\.?|number|code|#|:)??\s*[:：#-]?\s*([A-Z0-9][A-Z0-9-]{4,15})/i,
    /\b([A-Z0-9]{6,10})\b/,
  ]);
  if (referenceCode) { confidence += 15; evidence.push(`พบเลขอ้างอิง ${referenceCode}`); }

  const providerExplicit = firstMatch(text, [
    /(?:provider|operator|hotel|airline|company|ผู้ให้บริการ|บริษัท|โรงแรม|สายการบิน)\s*[:：-]\s*([^\n]{3,80})/i,
  ]);

  const date = findDate(text);
  const time = findTime(text);
  const startAt = date ? toIsoLocal(date, time) : "";
  if (date) { confidence += 10; evidence.push(`พบวันที่ ${date}`); }

  const amountMatch = text.match(/(?:¥|JPY\s*)([\d,]+(?:\.\d{1,2})?)|(?:฿|THB\s*)([\d,]+(?:\.\d{1,2})?)|(?:\$|USD\s*)([\d,]+(?:\.\d{1,2})?)/i);
  const amount = (amountMatch?.[1] || amountMatch?.[2] || amountMatch?.[3] || "").replace(/,/g, "");
  const currency: ImportedBookingDraft["currency"] = amountMatch?.[2] ? "THB" : amountMatch?.[3] ? "USD" : "JPY";
  if (amount) { confidence += 5; evidence.push(`พบยอด ${amount} ${currency}`); }

  const cityHits = tripCities.filter((city) => text.toLowerCase().includes(city.toLowerCase()));
  const origin = firstMatch(text, [/(?:from|origin|pickup|pick[ -]?up|รับรถ|ต้นทาง)\s*[:：-]\s*([^\n]{2,60})/i]) || cityHits[0] || "";
  const destination = firstMatch(text, [/(?:to|destination|drop[ -]?off|return|ปลายทาง|คืนรถ)\s*[:：-]\s*([^\n]{2,60})/i]) || cityHits[1] || "";

  const titleLine = rawClean.split("\n").map((line) => line.trim()).find((line) => line.length >= 4 && line.length <= 70 && !/booking|confirmation|reference|voucher/i.test(line));
  const fileStem = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const title = titleLine || fileStem || [providerExplicit, typeLabel(bookingType)].filter(Boolean).join(" · ") || typeLabel(bookingType);
  const provider = providerExplicit || (/hotel|ryokan|inn|resort|rent|air|airways|airline|jr |rail|bus/i.test(title) ? title : "");
  if (provider) { confidence += 10; evidence.push(`พบผู้ให้บริการ ${provider}`); }
  const safeConfidence = Math.max(10, Math.min(95, confidence));

  return { bookingType, title, provider, referenceCode, startAt, endAt: "", amount, currency, origin, destination, confidence: safeConfidence, evidence };
}

export function extractLocalFileText(fileName: string, mimeType: string, bytes: ArrayBuffer) {
  const lower = fileName.toLowerCase();
  if (mimeType.startsWith("text/") || /\.(txt|csv|json|md)$/i.test(lower)) {
    return clean(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const latin = new TextDecoder("latin1", { fatal: false }).decode(bytes);
    const chunks: string[] = [];
    const simple = /\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = simple.exec(latin)) && chunks.length < 500) chunks.push(match[1].replace(/\\([()\\])/g, "$1").replace(/\\n/g, " "));
    const arrays = /\[([\s\S]*?)\]\s*TJ/g;
    while ((match = arrays.exec(latin)) && chunks.length < 800) {
      const inside = match[1];
      const piece = [...inside.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)/g)].map((m) => m[1]).join(" ");
      if (piece) chunks.push(piece);
    }
    return clean(chunks.join("\n"));
  }
  return "";
}

export function documentCategoryForBooking(type: ImportedBookingDraft["bookingType"]) {
  return type === "hotel" ? "hotel" : type === "flight" ? "flight" : type === "rental_car" ? "rental_car" : type === "train" || type === "bus" ? "rail_bus" : "voucher";
}

export function bookingTypeToMode(type: ImportedBookingDraft["bookingType"]) {
  return type === "flight" ? "flight" : type === "train" ? "train" : type === "bus" ? "bus" : type === "rental_car" ? "car" : null;
}

export function haversineKm(a: { latitude?: number | null; longitude?: number | null }, b: { latitude?: number | null; longitude?: number | null }) {
  const lat1 = Number(a.latitude); const lon1 = Number(a.longitude); const lat2 = Number(b.latitude); const lon2 = Number(b.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return 0;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function routeDistanceKm(items: OptimizableActivity[]) {
  let total = 0;
  for (let i = 0; i < items.length - 1; i += 1) total += haversineKm(items[i], items[i + 1]);
  return total;
}

export function optimizeActivityRoute(items: OptimizableActivity[]) {
  const current = [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  if (current.length <= 2) return current;

  const hasPoint = (item: OptimizableActivity) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
  const nearestOrder = (candidates: OptimizableActivity[], start?: OptimizableActivity | null) => {
    const located = candidates.filter(hasPoint);
    const missing = candidates.filter((item) => !hasPoint(item));
    if (located.length <= 1) return [...located, ...missing];
    const ordered: OptimizableActivity[] = [];
    let cursor = start && hasPoint(start) ? start : located[0];
    if (!start || !hasPoint(start)) { ordered.push(cursor); located.splice(located.findIndex((x) => x.id === cursor.id), 1); }
    while (located.length) {
      let best = 0; let bestDistance = Number.POSITIVE_INFINITY;
      located.forEach((candidate, index) => { const distance = haversineKm(cursor, candidate); if (distance < bestDistance) { best = index; bestDistance = distance; } });
      cursor = located.splice(best, 1)[0]; ordered.push(cursor);
    }
    return [...ordered, ...missing];
  };

  // Fixed-time activities are schedule anchors. Keep their relative order and
  // optimize only the untimed activities around them, so route optimization
  // never silently turns a 09:00/12:00/15:00 plan into a time-inconsistent list.
  const fixedCount = current.filter((item) => Boolean(item.start_time)).length;
  if (fixedCount >= 2) {
    const result: OptimizableActivity[] = [];
    let pending: OptimizableActivity[] = [];
    let lastAnchor: OptimizableActivity | null = null;
    for (const item of current) {
      if (item.start_time) {
        result.push(...nearestOrder(pending, lastAnchor));
        pending = [];
        result.push(item);
        lastAnchor = item;
      } else {
        pending.push(item);
      }
    }
    result.push(...nearestOrder(pending, lastAnchor));
    return result;
  }

  const fixed = current.find((item) => item.start_time && hasPoint(item)) || current.find(hasPoint) || current[0];
  const rest = current.filter((item) => item.id !== fixed.id);
  return [fixed, ...nearestOrder(rest, fixed)];
}

export function minutesToTime(total: number) {
  const safe = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function timeToMinuteValue(value?: string | null) {
  if (!value) return null;
  const [h, m] = value.slice(0, 5).split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}
