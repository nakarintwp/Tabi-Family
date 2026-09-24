import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { buildUnifiedTimeline, type V9Booking } from "@/lib/v9";
import { type V8Day, type V8Transport } from "@/lib/v8";

export default async function TimelinePage({ params }: { params: Promise<{ id:string }> }){
  const {id}=await params; const {supabase}=await requireVerifiedUser(`/trips/${id}/timeline`);
  const [{data:trip},{data:transports},{data:bookings}]=await Promise.all([
    supabase.from("trips").select("id,title,trip_days(id,trip_date,title,activities(id,title,activity_type,start_time,duration_minutes,location_name,sort_order,status))").eq("id",id).single(),
    supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id",id).order("sort_order"),
    supabase.from("bookings").select("id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes,details").eq("trip_id",id).neq("booking_type","document").order("start_at",{ascending:true,nullsFirst:false})
  ]); if(!trip) notFound();
  const days=([...(trip.trip_days||[])] as V8Day[]).sort((a,b)=>a.trip_date.localeCompare(b.trip_date));
  const items=buildUnifiedTimeline(days,(transports||[]) as V8Transport[],(bookings||[]) as V9Booking[],id);
  const byDate=new Map<string,typeof items>(); for(const item of items){const list=byDate.get(item.date)||[];list.push(item);byDate.set(item.date,list);}
  return <main className="shell"><div className="container"><AppHeader/><div className="planner-topbar"><Link href={`/trips/${id}/command-center`} className="back-link">‹ Command Center</Link><span className="planner-counter">V9.1 Unified Timeline</span></div><section className="planner-hero timeline-hero"><div><span className="eyebrow">REAL BOOKING TIMELINE</span><h1>🕒 Trip Timeline</h1><p>{trip.title} · Activity + Transport + Booking เรียงตามวันและเวลา</p></div><Link className="btn btn-secondary" href={`/trips/${id}/master-plan`}>Master Plan</Link></section>
  <section className="section"><div className="timeline-v9">{[...byDate.entries()].map(([date,rows],dayIndex)=><article className="timeline-day-v9" key={date}><div className="timeline-day-date"><span>DAY {dayIndex+1}</span><strong>{date}</strong></div><div className="timeline-v9-list">{rows.map((item)=><Link href={item.href||"#"} className={`timeline-v9-row ${item.kind}`} key={item.id}><time>{item.time||"—"}</time><span className="timeline-v9-icon">{item.icon}</span><div><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}<em>{item.kind}</em></div></Link>)}</div></article>)}</div>{!items.length&&<div className="empty-state"><div className="empty-icon">🕒</div><h2>Timeline ยังว่าง</h2><p>เพิ่มกิจกรรม การเดินทาง หรือ Booking ก่อน</p></div>}</section>
  </div><BottomNav active="/plan"/></main>;
}
