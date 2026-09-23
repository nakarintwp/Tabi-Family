export type PaceActivity = {
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  child_friendly?: boolean | null;
  senior_friendly?: boolean | null;
  duration_minutes?: number | null;
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

export function calculatePaceScore(activities: PaceActivity[], members: PaceMember[], tripPace: string = "balanced") {
  const distanceKm = estimateRouteDistanceKm(activities);
  const walkingLevels = members.map((m) => Number(m.walking_level || 3));
  const lowestWalking = walkingLevels.length ? Math.min(...walkingLevels) : 3;
  const walkingLimitByLevel: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 16 };
  const comfortableKm = walkingLimitByLevel[lowestWalking] || 8;
  const totalMinutes = activities.reduce((sum, item) => sum + Math.max(0, Number(item.duration_minutes || 0)), 0);
  const suggestedActivities = tripPace === "relaxed" ? 4 : tripPace === "packed" ? 7 : 5;

  let score = 100;
  if (distanceKm > comfortableKm) score -= Math.min(30, Math.round((distanceKm - comfortableKm) * 6));
  if (activities.length > suggestedActivities) score -= Math.min(25, (activities.length - suggestedActivities) * 5);
  if (totalMinutes > 600) score -= Math.min(20, Math.ceil((totalMinutes - 600) / 60) * 4);

  const hasChild = members.some((m) => m.member_type === "child");
  const hasSenior = members.some((m) => m.member_type === "senior");
  if (hasChild) score -= activities.filter((a) => a.child_friendly === false).length * 8;
  if (hasSenior) score -= activities.filter((a) => a.senior_friendly === false).length * 10;
  if (members.some((m) => m.needs_frequent_rest) && activities.length >= suggestedActivities + 1) score -= 8;
  if (members.some((m) => m.avoid_stairs) && activities.length >= suggestedActivities + 2) score -= 5;

  score = Math.max(0, Math.min(100, score));
  const label = score >= 85 ? "สบาย" : score >= 70 ? "พอดี" : score >= 50 ? "ค่อนข้างแน่น" : "หนักเกินไป";
  const tone = score >= 85 ? "good" : score >= 70 ? "balanced" : score >= 50 ? "busy" : "hard";

  const tips: string[] = [];
  if (activities.length > suggestedActivities) tips.push(`ทริปแบบ ${tripPace} แนะนำประมาณ ${suggestedActivities} กิจกรรม/วัน`);
  if (totalMinutes > 600) tips.push(`เวลาทำกิจกรรมรวมประมาณ ${Math.round(totalMinutes / 60)} ชม. ควรเผื่อเดินทางและพัก`);
  if (distanceKm > comfortableKm) tips.push(`ระยะทางจากพิกัดที่มีประมาณ ${distanceKm.toFixed(1)} กม. สูงกว่าระดับเดินสบายของครอบครัว`);
  if (hasSenior && activities.some((a) => a.senior_friendly === false)) tips.push("มีจุดที่ทำเครื่องหมายว่าไม่เหมาะกับผู้สูงอายุ");
  if (hasChild && activities.some((a) => a.child_friendly === false)) tips.push("มีจุดที่ทำเครื่องหมายว่าไม่เหมาะกับเด็ก");
  if (!tips.length) tips.push("แผนวันนี้สมดุลกับโปรไฟล์ครอบครัวและรูปแบบทริปในข้อมูลปัจจุบัน");

  return { score, label, tone, distanceKm, comfortableKm, totalMinutes, suggestedActivities, tips };
}

export function mapsSearchUrl(name?: string | null, explicitUrl?: string | null) {
  if (explicitUrl?.trim()) return explicitUrl.trim();
  if (!name?.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}`;
}

export function googleMapsDirectionsUrl(activities: PaceActivity[]) {
  const labels = activities
    .map((a) => a.location_name?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 10);
  if (!labels.length) return null;
  const destination = labels[labels.length - 1];
  const waypoints = labels.slice(0, -1);
  // Omit origin intentionally: Google Maps can use the device/current location.
  // V4.1 CurrentLocationRoute can also provide an explicit browser GPS origin.
  const params = new URLSearchParams({ api: "1", destination, travelmode: "transit" });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
