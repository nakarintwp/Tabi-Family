export type V8Activity = {
  id: string;
  title: string;
  start_time: string | null;
  duration_minutes: number | null;
  activity_type?: string | null;
  location_name?: string | null;
  status?: string | null;
  sort_order?: number | null;
};

export type V8Day = {
  id: string;
  trip_date: string;
  title: string | null;
  activities?: V8Activity[] | null;
};

export type V8Transport = {
  id: string;
  day_id: string | null;
  mode: string;
  operator?: string | null;
  service_name?: string | null;
  origin: string;
  destination: string;
  departure_time: string | null;
  arrival_time: string | null;
  reservation_required?: boolean;
  booking_reference?: string | null;
  seat?: string | null;
  notes?: string | null;
};

export type ConflictItem = {
  level: "high" | "medium" | "low";
  title: string;
  detail: string;
  dayId?: string;
  dayDate?: string;
};

export function timeToMinutes(time?: string | null) {
  if (!time) return null;
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function durationLabel(start?: string | null, end?: string | null) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s == null || e == null) return null;
  let mins = e - s;
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h} ชม. ` : ""}${m ? `${m} นาที` : h ? "" : "0 นาที"}`.trim();
}

export function japanDateKey(value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

export function detectTripConflicts(days: V8Day[], transports: V8Transport[]): ConflictItem[] {
  const issues: ConflictItem[] = [];
  const sortedDays = [...days].sort((a, b) => a.trip_date.localeCompare(b.trip_date));

  for (const day of sortedDays) {
    const activities = [...(day.activities || [])].sort((a, b) => (timeToMinutes(a.start_time) ?? 9999) - (timeToMinutes(b.start_time) ?? 9999));
    const timed = activities.filter((a) => timeToMinutes(a.start_time) != null);

    if (activities.length >= 8) {
      issues.push({ level: "medium", title: "วันค่อนข้างแน่น", detail: `${day.trip_date} มี ${activities.length} กิจกรรม แนะนำเผื่อเวลาพัก/เดินทาง`, dayId: day.id, dayDate: day.trip_date });
    }

    if (activities.length >= 4 && timed.length < Math.ceil(activities.length / 2)) {
      issues.push({ level: "low", title: "หลายกิจกรรมยังไม่มีเวลา", detail: `${day.trip_date} มี ${activities.length - timed.length} จุดที่ยังไม่กำหนดเวลา`, dayId: day.id, dayDate: day.trip_date });
    }

    for (let i = 0; i < timed.length - 1; i += 1) {
      const current = timed[i];
      const next = timed[i + 1];
      const start = timeToMinutes(current.start_time) ?? 0;
      const end = start + Math.max(15, current.duration_minutes || 60);
      const nextStart = timeToMinutes(next.start_time) ?? 9999;
      if (end > nextStart) {
        issues.push({
          level: "high",
          title: "เวลาทับซ้อนกัน",
          detail: `${current.title} อาจจบหลังเวลาเริ่ม ${next.title}`,
          dayId: day.id,
          dayDate: day.trip_date,
        });
      } else if (nextStart - end < 20 && current.location_name && next.location_name && current.location_name !== next.location_name) {
        issues.push({
          level: "medium",
          title: "เวลาเปลี่ยนสถานที่น้อย",
          detail: `${current.title} → ${next.title} มี buffer น้อยกว่า 20 นาที`,
          dayId: day.id,
          dayDate: day.trip_date,
        });
      }
    }

    const dayTransports = transports.filter((t) => t.day_id === day.id);
    for (const segment of dayTransports) {
      const dep = timeToMinutes(segment.departure_time);
      if (dep == null) continue;
      for (const activity of timed) {
        const start = timeToMinutes(activity.start_time) ?? 0;
        const end = start + Math.max(15, activity.duration_minutes || 60);
        if (dep > start && dep < end) {
          issues.push({
            level: "high",
            title: "กิจกรรมชนเวลาเดินทาง",
            detail: `${activity.title} ทับกับ ${segment.origin} → ${segment.destination} เวลา ${segment.departure_time?.slice(0, 5)}`,
            dayId: day.id,
            dayDate: day.trip_date,
          });
        }
      }
      if (segment.mode === "car" && !segment.booking_reference) {
        issues.push({ level: "medium", title: "รถเช่ายังไม่มี Booking ref", detail: `${segment.origin} → ${segment.destination} ควรบันทึกเลขจอง`, dayId: day.id, dayDate: day.trip_date });
      }
      if (segment.mode === "car" && !(segment.notes || "").toLowerCase().match(/snow|winter|tire|タイヤ|ยาง/)) {
        issues.push({ level: "low", title: "ตรวจอุปกรณ์ฤดูหนาว", detail: `${segment.origin} → ${segment.destination}: ถ้าเข้าพื้นที่หิมะให้ยืนยัน Snow tire/chain กับบริษัทเช่ารถ`, dayId: day.id, dayDate: day.trip_date });
      }
    }
  }

  return issues;
}

export function mapsDirectionsUrl(origin: string, destination: string, mode: string = "driving") {
  const params = new URLSearchParams({ api: "1", origin: `${origin}, Japan`, destination: `${destination}, Japan`, travelmode: mode });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function mapsSearchUrlV8(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query}, Japan`)}`;
}
