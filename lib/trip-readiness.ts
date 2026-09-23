export type ReadinessInput = {
  startDate?: string | null;
  endDate?: string | null;
  cities?: string[] | null;
  membersCount: number;
  daysCount: number;
  plannedDays: number;
  bookings: Array<{ booking_type?: string | null }>;
  packingCount: number;
  packedCount: number;
  transportCount: number;
};

export type ReadinessItem = {
  key: string;
  label: string;
  detail: string;
  points: number;
  earned: number;
  done: boolean;
};

export function calculateReadiness(input: ReadinessInput) {
  const hasDates = Boolean(input.startDate && input.endDate);
  const hasCities = Boolean(input.cities?.length);
  const hasFamily = input.membersCount > 0;
  const itineraryRatio = input.daysCount ? Math.min(1, input.plannedDays / input.daysCount) : 0;
  const hasFlight = input.bookings.some((b) => b.booking_type === "flight");
  const hasHotel = input.bookings.some((b) => b.booking_type === "hotel");
  const packingRatio = input.packingCount ? Math.min(1, input.packedCount / input.packingCount) : 0;
  const transportNeeded = (input.cities?.length || 0) > 1;
  const hasTransport = !transportNeeded || input.transportCount > 0;

  const items: ReadinessItem[] = [
    { key: "dates", label: "วันเดินทาง", detail: hasDates ? "กำหนดวันไป-กลับแล้ว" : "เพิ่มวันเดินทาง", points: 8, earned: hasDates ? 8 : 0, done: hasDates },
    { key: "cities", label: "เมืองหลัก", detail: hasCities ? `${input.cities?.length || 0} เมือง` : "เพิ่มเมืองที่จะไป", points: 7, earned: hasCities ? 7 : 0, done: hasCities },
    { key: "family", label: "Family Profile", detail: hasFamily ? `${input.membersCount} คน` : "เพิ่มสมาชิกครอบครัว", points: 10, earned: hasFamily ? 10 : 0, done: hasFamily },
    { key: "itinerary", label: "Day Plan", detail: `${input.plannedDays}/${input.daysCount} วันมีแผน`, points: 25, earned: Math.round(25 * itineraryRatio), done: itineraryRatio >= 0.95 },
    { key: "flight", label: "Flight", detail: hasFlight ? "มี Booking แล้ว" : "ยังไม่มี Flight ใน Wallet", points: 12, earned: hasFlight ? 12 : 0, done: hasFlight },
    { key: "hotel", label: "Hotel", detail: hasHotel ? "มี Booking แล้ว" : "ยังไม่มี Hotel ใน Wallet", points: 12, earned: hasHotel ? 12 : 0, done: hasHotel },
    { key: "transport", label: "Transport", detail: transportNeeded ? (input.transportCount > 0 ? `${input.transportCount} ช่วงการเดินทาง` : "เพิ่มรถไฟ/รถบัสระหว่างเมือง") : "ทริปเมืองเดียว — ไม่บังคับ", points: 10, earned: hasTransport ? 10 : 0, done: hasTransport },
    { key: "packing", label: "Packing", detail: input.packingCount ? `${input.packedCount}/${input.packingCount} พร้อม` : "สร้าง Packing List", points: 16, earned: Math.round(16 * packingRatio), done: packingRatio >= 0.95 },
  ];

  const score = Math.min(100, items.reduce((sum, item) => sum + item.earned, 0));
  const label = score >= 90 ? "พร้อมเดินทาง" : score >= 70 ? "เกือบพร้อม" : score >= 45 ? "กำลังเตรียม" : "เริ่มวางแผน";
  return { score, label, items };
}
