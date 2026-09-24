import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ReadinessCard } from "@/components/ReadinessCard";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { calculateReadiness } from "@/lib/trip-readiness";

export default async function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/readiness`);
  const [{ data: trip }, { count: transportCount }] = await Promise.all([
    supabase.from("trips").select("id,title,start_date,end_date,cities,trip_members(id),trip_days(id,activities(id)),bookings(id,booking_type),packing_items(id,is_packed)").eq("id", id).single(),
    supabase.from("transport_segments").select("id", { count: "exact", head: true }).eq("trip_id", id),
  ]);
  if (!trip) notFound();
  const days = trip.trip_days || [];
  const packing = trip.packing_items || [];
  const readiness = calculateReadiness({
    startDate: trip.start_date,
    endDate: trip.end_date,
    cities: trip.cities,
    membersCount: trip.trip_members?.length || 0,
    daysCount: days.length,
    plannedDays: days.filter((d) => (d.activities?.length || 0) > 0).length,
    bookings: trip.bookings || [],
    packingCount: packing.length,
    packedCount: packing.filter((item) => item.is_packed).length,
    transportCount: transportCount || 0,
  });

  const links: Record<string, string> = {
    dates: `/trips/${id}`,
    cities: `/trips/${id}`,
    family: `/trips/${id}/family`,
    itinerary: `/trips/${id}/calendar`,
    flight: `/trips/${id}/wallet`,
    hotel: `/trips/${id}/wallet`,
    transport: `/trips/${id}/transport`,
    packing: `/trips/${id}/packing`,
  };

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/more`} className="back-link">‹ More</Link><span className="planner-counter">Readiness</span></div>
    <section className="planner-hero readiness-hero"><div><span className="eyebrow">BEFORE YOU GO</span><h1>✅ Trip Readiness</h1><p>{trip.title}</p></div></section>
    <ReadinessCard tripId={id} score={readiness.score} label={readiness.label} items={readiness.items} />
    <section className="section"><div className="section-head"><h2>Checklist</h2><span className="small muted">รวม 100 คะแนน</span></div><div className="readiness-checklist">{readiness.items.map((item) => <Link href={links[item.key] || `/trips/${id}`} className={`readiness-check ${item.done ? "done" : ""}`} key={item.key}><span className="readiness-check-icon">{item.done ? "✓" : "○"}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><b>{item.earned}/{item.points}</b><span className="chevron">›</span></Link>)}</div></section>
  </div><BottomNav active="/more" tripId={id} /></main>;
}
