import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { DISCOVERY_PLACES, getPlaceGuide } from "@/lib/discovery";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { createSmartDayPlan } from "./actions";

type SmartTripDay = { id: string; trip_date: string; title: string | null };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

export default async function SmartPlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ city?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/smart-plan`);
  const [{ data: trip }, { data: role }] = await Promise.all([
    supabase.from("trips").select("id,title,cities,trip_days(id,trip_date,title)").eq("id", id).single(),
    supabase.rpc("trip_access_role", { p_trip_id: id }),
  ]);
  if (!trip) notFound();
  const canEdit = role === "owner" || role === "editor";
  const cities: string[] = trip.cities || [];
  const activeCity = query.city && cities.includes(query.city) ? query.city : (cities[0] || "");
  const days: SmartTripDay[] = ([...(trip.trip_days || [])] as SmartTripDay[]).sort((a: SmartTripDay, b: SmartTripDay) => a.trip_date.localeCompare(b.trip_date));
  const choices = DISCOVERY_PLACES
    .filter((place) => !cities.length || place.city === activeCity)
    .sort((a, b) => Number(Boolean(b.thaiPopular)) - Number(Boolean(a.thaiPopular)) || a.category.localeCompare(b.category))
    .slice(0, 14);
  const defaults = new Set(choices.slice(0, 5).map((place) => place.slug));

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/explore?trip=${id}`} className="back-link">‹ Explore</Link><span className="planner-counter">V7.7 Smart Day</span></div>
    <section className="planner-hero smart-plan-hero"><div><span className="eyebrow">SMART DAY PLANNER · ¥0 AI/API</span><h1>จัดวันเที่ยวจากสถานที่ที่เลือก</h1><p>เลือก 3–8 จุด แล้วระบบเรียงเป็นแผนรายวันพร้อมเวลาเริ่มต้นให้แก้ต่อได้ใน Day Planner</p></div><Link href={`/trips/${id}/route`} className="btn btn-secondary">Trip Route</Link></section>

    <section className="section">
      <div className="section-head"><h2>เลือกเมือง</h2><span className="small muted">{trip.title}</span></div>
      <div className="filter-chip-row">{cities.map((city: string) => <Link key={city} href={`/trips/${id}/smart-plan?city=${encodeURIComponent(city)}`} className={`filter-chip ${activeCity === city ? "active" : ""}`}>{city}</Link>)}</div>
    </section>

    {!canEdit ? <div className="notice"><span>👀</span><div><strong>Viewer mode</strong><br/><span className="muted">ดูคำแนะนำได้ แต่ต้องเป็น Owner หรือ Editor จึงจะสร้าง Smart Day ได้</span></div></div> : !days.length ? <div className="empty-state"><h2>ยังไม่มี Day</h2><p>Trip ต้องมีวันเดินทางก่อน</p></div> : <form action={createSmartDayPlan} className="smart-plan-form">
      <input type="hidden" name="trip_id" value={id} />
      <section className="section smart-day-target">
        <div className="section-head"><h2>เลือก Day</h2><span className="small muted">ระบบจะเพิ่มต่อท้ายกิจกรรมเดิม</span></div>
        <select className="select" name="day_id" defaultValue={days[0]?.id}>{days.map((day, index) => <option value={day.id} key={day.id}>Day {index + 1} · {dateLabel(day.trip_date)} · {day.title || "ยังไม่มีชื่อ"}</option>)}</select>
      </section>

      <section className="section">
        <div className="section-head"><h2>เลือกสถานที่ · {activeCity || "Trip"}</h2><span className="small muted">แนะนำเลือก 4–5 จุด/วัน</span></div>
        <div className="smart-place-grid">{choices.map((place) => { const guide = getPlaceGuide(place.slug); return <label className="smart-place-option" key={place.slug}>
          <input type="checkbox" name="place_slugs" value={place.slug} defaultChecked={defaults.has(place.slug)} />
          <span className="smart-place-check">✓</span>
          <div><strong>{place.title}</strong><small>{place.area} · {place.durationMinutes} นาที</small><p>{place.summary}</p><div className="tag-row">{place.thaiPopular && <span className="mini-tag">คนไทยนิยม</span>}{guide.bestTime && <span className="mini-tag">{guide.bestTime}</span>}{place.category === "food" && <span className="mini-tag">อาหาร</span>}</div></div>
        </label>; })}</div>
      </section>
      <div className="smart-plan-sticky"><div><strong>Smart order</strong><small>เรียงสถานที่เที่ยวก่อน มื้ออาหาร/ช้อปปิ้งตามจังหวะวัน และใส่เวลาเริ่มต้นอัตโนมัติ</small></div><SubmitButton className="btn btn-primary" pendingText="กำลังสร้างแผน...">สร้าง Smart Day</SubmitButton></div>
    </form>}
  </div><BottomNav active="/plan" /></main>;
}
