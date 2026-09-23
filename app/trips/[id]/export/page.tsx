import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ExportTools } from "@/components/ExportTools";
import { requireVerifiedUser } from "@/lib/supabase/auth";

function d(value: string) { return new Intl.DateTimeFormat("th-TH", { day:"numeric", month:"short", year:"numeric" }).format(new Date(`${value}T00:00:00`)); }

export default async function ExportPage({ params }: { params: Promise<{ id:string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/export`);
  const { data: trip } = await supabase.from("trips").select(`
    id,title,start_date,end_date,cities,pace,budget,currency,created_at,updated_at,
    trip_members(id,name,member_type,age,walking_level,needs,interests,dietary_notes,avoid_stairs,needs_frequent_rest,uses_stroller,mobility_notes),
    trip_days(id,trip_date,title,notes,activities(id,title,activity_type,start_time,duration_minutes,location_name,maps_url,notes,child_friendly,senior_friendly,sort_order,status,is_outdoor,rain_alternative)),
    bookings(id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes),
    expenses(id,category,amount,currency,paid_at,note),
    packing_items(id,label,category,assigned_to,quantity,is_packed,notes,sort_order)
  `).eq("id", id).single();
  if (!trip) notFound();
  const days = [...(trip.trip_days || [])].sort((a:any,b:any)=>a.trip_date.localeCompare(b.trip_date)).map((day:any)=>({...day,activities:[...(day.activities||[])].sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0))}));
  const serializable = { ...trip, trip_days: days };
  return <main className="shell print-shell"><div className="container"><div className="no-print"><AppHeader /><Link className="back-link" href={`/trips/${id}`}>‹ กลับ Dashboard</Link></div>
    <section className="export-cover"><span className="eyebrow">TABi FAMILY · TRIP EXPORT</span><h1>{trip.title}</h1><p>{trip.start_date ? d(trip.start_date) : ""} {trip.end_date ? `– ${d(trip.end_date)}` : ""}</p><p>{trip.cities?.join(" • ")}</p></section>
    <ExportTools trip={serializable} />
    <section className="section print-section"><h2>Itinerary</h2>{days.map((day:any,index:number)=><article className="print-day" key={day.id}><div className="print-day-head"><strong>Day {index+1} · {day.title || "แผนเดินทาง"}</strong><span>{d(day.trip_date)}</span></div>{day.activities?.length ? <table className="print-table"><tbody>{day.activities.map((a:any)=><tr key={a.id}><td>{a.start_time?.slice(0,5)||"—"}</td><td><strong>{a.title}</strong>{a.location_name && <small>{a.location_name}</small>}</td><td>{a.status === "done" ? "✓" : a.status === "skipped" ? "ข้าม" : ""}</td></tr>)}</tbody></table> : <p className="muted">ยังไม่มีกิจกรรม</p>}</article>)}</section>
    <section className="section print-section"><h2>Bookings</h2>{(trip.bookings||[]).map((b:any)=><div className="print-line" key={b.id}><strong>{b.title || b.provider || b.booking_type}</strong><span>{b.reference_code || ""}</span></div>)}</section>
    <section className="section print-section"><h2>Family</h2><div className="print-grid">{(trip.trip_members||[]).map((m:any)=><div key={m.id}><strong>{m.name}</strong><span>{m.member_type} · เดิน {m.walking_level}/5</span></div>)}</div></section>
    <section className="section print-section"><h2>Budget</h2><p>งบประมาณ: {trip.budget ? `฿${Number(trip.budget).toLocaleString("th-TH")}` : "—"}</p></section>
  </div><div className="no-print"><BottomNav active="/trips" /></div></main>;
}
