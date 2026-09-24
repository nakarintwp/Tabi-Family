import { japanDateKey, timeToMinutes, type V8Day, type V8Transport } from "@/lib/v8";

export type V9Booking = {
  id: string;
  booking_type: string;
  title?: string | null;
  provider?: string | null;
  reference_code?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  confirmation_url?: string | null;
  notes?: string | null;
  details?: Record<string, unknown> | null;
};

export type TimelineItem = {
  id: string;
  date: string;
  time: string | null;
  kind: "activity" | "transport" | "booking";
  icon: string;
  title: string;
  subtitle?: string;
  href?: string;
  sort: number;
};

export type SmartAlert = {
  level: "high" | "medium" | "low";
  title: string;
  detail: string;
  href?: string;
  group: "booking" | "transport" | "document" | "family" | "schedule";
};

function bookingDetail(booking: V9Booking, key: string) {
  const value = booking.details?.[key];
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

function bookingIcon(type: string) {
  return type === "flight" ? "✈️" : type === "hotel" ? "🏨" : type === "rental_car" ? "🚙" : type === "train" ? "🚄" : type === "bus" ? "🚌" : type === "restaurant" ? "🍽️" : type === "document" ? "📄" : "🎟️";
}

function transportIcon(mode: string) {
  return mode === "car" ? "🚙" : mode === "train" ? "🚆" : mode === "bus" ? "🚌" : mode === "flight" ? "✈️" : mode === "walk" ? "🚶" : mode === "taxi" ? "🚕" : mode === "ferry" ? "⛴️" : "➡️";
}

function activityIcon(type?: string | null) {
  return type === "food" ? "🍜" : type === "shopping" ? "🛍️" : type === "hotel" ? "🏨" : type === "transport" ? "🚆" : "📍";
}

export function buildUnifiedTimeline(days: V8Day[], transports: V8Transport[], bookings: V9Booking[], tripId: string): TimelineItem[] {
  const dayDate = new Map(days.map((day) => [day.id, day.trip_date]));
  const items: TimelineItem[] = [];

  for (const day of days) {
    for (const activity of day.activities || []) {
      const minutes = timeToMinutes(activity.start_time) ?? 23 * 60 + 50 + (activity.sort_order || 0);
      items.push({
        id: `a-${activity.id}`,
        date: day.trip_date,
        time: activity.start_time?.slice(0, 5) || null,
        kind: "activity",
        icon: activityIcon(activity.activity_type),
        title: activity.title,
        subtitle: activity.location_name || undefined,
        href: `/trips/${tripId}/days/${day.id}`,
        sort: minutes,
      });
    }
  }

  for (const segment of transports) {
    const date = segment.day_id ? dayDate.get(segment.day_id) : undefined;
    if (!date) continue;
    items.push({
      id: `t-${segment.id}`,
      date,
      time: segment.departure_time?.slice(0, 5) || null,
      kind: "transport",
      icon: transportIcon(segment.mode),
      title: `${segment.origin} → ${segment.destination}`,
      subtitle: [segment.operator, segment.service_name].filter(Boolean).join(" · ") || segment.mode,
      href: `/trips/${tripId}/transport`,
      sort: timeToMinutes(segment.departure_time) ?? 23 * 60 + 55,
    });
  }

  for (const booking of bookings) {
    const date = japanDateKey(booking.start_at || null);
    if (!date) continue;
    let time: string | null = null;
    if (booking.start_at) {
      try {
        time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(booking.start_at));
      } catch {}
    }
    items.push({
      id: `b-${booking.id}`,
      date,
      time,
      kind: "booking",
      icon: bookingIcon(booking.booking_type),
      title: booking.title || booking.provider || booking.booking_type,
      subtitle: booking.reference_code ? `Ref ${booking.reference_code}` : booking.provider || undefined,
      href: `/trips/${tripId}/bookings`,
      sort: timeToMinutes(time) ?? 23 * 60 + 58,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.sort - b.sort || a.kind.localeCompare(b.kind));
}

export function buildSmartAlerts(input: {
  tripId: string;
  bookings: V9Booking[];
  transports: V8Transport[];
  documentCount: number;
  members?: Array<{ name: string; age?: number | null; passport_expiry?: string | null; child_seat?: boolean | null }>;
  tripEnd?: string | null;
}) {
  const alerts: SmartAlert[] = [];
  const { tripId, bookings, transports, documentCount, members = [], tripEnd } = input;

  for (const booking of bookings) {
    const status = bookingDetail(booking, "status").toLowerCase();
    const payment = bookingDetail(booking, "payment_status").toLowerCase();
    if (payment === "unpaid" || payment === "pending") alerts.push({ level: "high", group: "booking", title: "Booking ยังรอชำระ", detail: booking.title || booking.provider || booking.booking_type, href: `/trips/${tripId}/bookings` });
    if (!booking.reference_code && booking.booking_type !== "other") alerts.push({ level: "medium", group: "booking", title: "ยังไม่มีเลขจอง", detail: booking.title || booking.provider || booking.booking_type, href: `/trips/${tripId}/bookings` });
    if (status && !["confirmed", "paid", "complete"].includes(status)) alerts.push({ level: "low", group: "booking", title: "ตรวจสถานะ Booking", detail: `${booking.title || booking.provider || booking.booking_type} · ${status}`, href: `/trips/${tripId}/bookings` });
  }

  const carSegments = transports.filter((segment) => segment.mode === "car");
  for (const segment of carSegments) {
    if (!segment.booking_reference) alerts.push({ level: "medium", group: "transport", title: "รถเช่ายังไม่มี Booking ref", detail: `${segment.origin} → ${segment.destination}`, href: `/trips/${tripId}/driving` });
    const notes = (segment.notes || "").toLowerCase();
    if (!/(snow|winter|tire|tyre|chain|ยาง|โซ่)/.test(notes)) alerts.push({ level: "low", group: "transport", title: "ตรวจอุปกรณ์ฤดูหนาว", detail: `${segment.origin} → ${segment.destination} · ถ้าเข้าพื้นที่หิมะให้ยืนยันยาง/อุปกรณ์กับบริษัทเช่ารถ`, href: `/trips/${tripId}/driving` });
  }

  if (documentCount === 0) alerts.push({ level: "medium", group: "document", title: "Trip Documents ยังว่าง", detail: "เพิ่ม voucher, insurance, rental confirmation หรือสำเนาเอกสารที่จำเป็น", href: `/trips/${tripId}/documents` });

  for (const member of members) {
    if (member.passport_expiry && tripEnd && member.passport_expiry < tripEnd) alerts.push({ level: "high", group: "family", title: "Passport อาจหมดอายุก่อนจบทริป", detail: `${member.name} · หมดอายุ ${member.passport_expiry}`, href: `/trips/${tripId}/family` });
    if ((member.age ?? 99) < 6 && !member.child_seat && carSegments.length) alerts.push({ level: "medium", group: "family", title: "ตรวจ Child seat", detail: `${member.name} อายุ ${member.age} ปี · ทริปนี้มีรถเช่า`, href: `/trips/${tripId}/family` });
  }

  return alerts;
}

export function alertWeight(level: SmartAlert["level"]) {
  return level === "high" ? 3 : level === "medium" ? 2 : 1;
}
