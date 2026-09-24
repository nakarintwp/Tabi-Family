"use client";

import { RealMap, type RealMapPoint } from "@/components/RealMap";

type Point = { id: string; title: string; latitude: number; longitude: number; label?: string };

export function TripMap({ points, compact = false }: { apiKey?: string; points: Point[]; compact?: boolean }) {
  const mapPoints: RealMapPoint[] = points.map((point) => ({
    id: point.id,
    title: point.title,
    subtitle: point.label || null,
    latitude: point.latitude,
    longitude: point.longitude,
    kind: "attraction",
  }));

  return <RealMap points={mapPoints} connectPoints compact={compact} className="trip-map-inline" />;
}
