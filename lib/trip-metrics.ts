export type PaceActivity = {
  latitude?: number | null;
  longitude?: number | null;
  child_friendly?: boolean | null;
  senior_friendly?: boolean | null;
};

export type PaceMember = {
  member_type?: string | null;
  walking_level?: number | null;
  avoid_stairs?: boolean | null;
  needs_frequent_rest?: boolean | null;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateRouteDistanceKm(activities: PaceActivity[]) {
  const points = activities
    .filter((a) => Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude)))
    .map((a) => ({ latitude: Number(a.latitude), longitude: Number(a.longitude) }));

  if (points.length < 2) return 0;
  let straight = 0;
  for (let i = 1; i < points.length; i += 1) straight += haversineKm(points[i - 1], points[i]);
  return straight * 1.25;
}

export function calculatePaceScore(activities: PaceActivity[], members: PaceMember[]) {
  const distanceKm = estimateRouteDistanceKm(activities);
  const walkingLevels = members.map((m) => Number(m.walking_level || 3));
  const lowestWalking = walkingLevels.length ? Math.min(...walkingLevels) : 3;
  const walkingLimitByLevel: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 16 };
  const comfortableKm = walkingLimitByLevel[lowestWalking] || 8;

  let score = 100;
  if (distanceKm > comfortableKm) score -= Math.min(35, Math.round((distanceKm - comfortableKm) * 6));
  if (activities.length > 6) score -= Math.min(20, (activities.length - 6) * 4);

  const hasChild = members.some((m) => m.member_type === "child");
  const hasSenior = members.some((m) => m.member_type === "senior");
  if (hasChild) score -= activities.filter((a) => a.child_friendly === false).length * 8;
  if (hasSenior) score -= activities.filter((a) => a.senior_friendly === false).length * 10;
  if (members.some((m) => m.needs_frequent_rest) && activities.length >= 6) score -= 8;
  if (members.some((m) => m.avoid_stairs) && activities.length >= 7) score -= 5;

  score = Math.max(0, Math.min(100, score));
  const label = score >= 85 ? "สบาย" : score >= 70 ? "พอดี" : score >= 50 ? "ค่อนข้างแน่น" : "หนักเกินไป";
  const tone = score >= 85 ? "good" : score >= 70 ? "balanced" : score >= 50 ? "busy" : "hard";

  const mappedCount = activities.filter((a) => Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude))).length;
  const tips: string[] = [];
  if (activities.length > 0 && mappedCount < 2) tips.push("เพิ่มพิกัดอย่างน้อย 2 จุดเพื่อประเมินระยะทางของวันนี้ได้แม่นขึ้น");
  if (distanceKm > comfortableKm) tips.push(`ระยะทางประมาณ ${distanceKm.toFixed(1)} กม. สูงกว่าระดับเดินสบายของครอบครัว`);
  if (activities.length > 6) tips.push("กิจกรรมค่อนข้างเยอะ ควรเผื่อเวลาพักและการเดินทาง");
  if (hasSenior && activities.some((a) => a.senior_friendly === false)) tips.push("มีจุดที่ทำเครื่องหมายว่าไม่เหมาะกับผู้สูงอายุ");
  if (hasChild && activities.some((a) => a.child_friendly === false)) tips.push("มีจุดที่ทำเครื่องหมายว่าไม่เหมาะกับเด็ก");
  if (!tips.length) tips.push("แผนวันนี้สมดุลกับโปรไฟล์ครอบครัวในข้อมูลปัจจุบัน");

  return { score, label, tone, distanceKm, comfortableKm, tips };
}

export function googleMapsDirectionsUrl(activities: PaceActivity[]) {
  const points = activities
    .filter((a) => Number.isFinite(Number(a.latitude)) && Number.isFinite(Number(a.longitude)))
    .map((a) => `${Number(a.latitude)},${Number(a.longitude)}`)
    .slice(0, 10);
  if (points.length < 2) return null;
  const [origin, ...rest] = points;
  const destination = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1);
  const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "transit" });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
