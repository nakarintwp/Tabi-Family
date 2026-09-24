import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { DISCOVERY_DESTINATIONS } from "@/lib/discovery";
import { updateTripDestinations } from "./actions";

export default async function TripDestinationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, userId } = await requireVerifiedUser(`/trips/${id}/destinations`);
  const { data: trip } = await supabase.from("trips").select("id,title,owner_id,cities").eq("id", id).single();
  if (!trip) notFound();
  const isOwner = trip.owner_id === userId;
  const selected = new Set<string>(trip.cities || []);

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/more`} className="back-link">‹ More</Link><span className="planner-counter">Destinations</span></div>
    <section className="planner-hero destination-hero"><div><span className="eyebrow">TRIP SCOPE</span><h1>ชื่อเมือง / พื้นที่ที่จะไป</h1><p>{trip.title}</p></div><Link className="btn btn-secondary" href={`/explore?trip=${id}`}>✨ เปิด Explore</Link></section>
    {query.saved === "1" && <div className="success-box">อัปเดตพื้นที่ของ Trip แล้ว ✓</div>}
    {query.error && <div className="error-box">{query.error}</div>}

    <section className="section">
      <div className="section-head"><h2>Explore จะอิงจากรายการนี้</h2><span className="small muted">เลือกได้หลายเมือง</span></div>
      {!isOwner && <div className="notice"><span>👀</span><div><strong>Viewer / Editor</strong><br/><span className="muted">เฉพาะ Owner เท่านั้นที่แก้เมืองหลักของ Trip ได้</span></div></div>}
      <form action={updateTripDestinations} className="form-card destination-form">
        <input type="hidden" name="trip_id" value={id} />
        <div className="destination-picker compact-city-picker">
          {DISCOVERY_DESTINATIONS.map((destination) => <label className={`destination-option compact-city-option ${!isOwner ? "disabled" : ""}`} key={destination.id} title={`${destination.label} · ${destination.subtitle}`}>
            <input type="checkbox" name="cities" value={destination.id} defaultChecked={selected.has(destination.id)} disabled={!isOwner} />
            <span className="destination-option-region">{destination.subtitle}</span>
            <strong>{destination.label}</strong>
          </label>)}
        </div>

        {isOwner && <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังบันทึก...">บันทึกเมือง</SubmitButton>}
      </form>
    </section>

    <section className="section">
      <div className="trip-destination-summary"><div><strong>Explore scope ปัจจุบัน</strong><p>{(trip.cities || []).join(" → ") || "ยังไม่ได้เลือก"}</p></div><Link className="link" href={`/explore?trip=${id}`}>ดูสถานที่ ›</Link></div>
    </section>
  </div><BottomNav active="/more" tripId={id} /></main>;
}
