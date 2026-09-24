import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { BrowserNotificationButton } from "@/components/BrowserNotificationButton";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { buildSmartAlerts, alertWeight, type V9Booking } from "@/lib/v9";
import { type V8Transport } from "@/lib/v8";

export default async function NotificationsPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const{supabase}=await requireVerifiedUser(`/trips/${id}/notifications`);const[{data:trip},{data:transports},{data:bookings},{count:documentCount}]=await Promise.all([
  supabase.from("trips").select("id,title,end_date,trip_members(id,name,age,passport_expiry,child_seat)").eq("id",id).single(),
  supabase.from("transport_segments").select("id,day_id,mode,operator,service_name,origin,destination,departure_time,arrival_time,reservation_required,booking_reference,seat,notes").eq("trip_id",id),
  supabase.from("bookings").select("id,booking_type,title,provider,reference_code,start_at,end_at,confirmation_url,notes,details").eq("trip_id",id).neq("booking_type","document"),
  supabase.from("bookings").select("id",{count:"exact",head:true}).eq("trip_id",id).eq("booking_type","document")]);if(!trip)notFound();const alerts=buildSmartAlerts({tripId:id,bookings:(bookings||[]) as V9Booking[],transports:(transports||[]) as V8Transport[],documentCount:documentCount||0,members:trip.trip_members||[],tripEnd:trip.end_date}).sort((a,b)=>alertWeight(b.level)-alertWeight(a.level));return <main className="shell"><div className="container"><AppHeader/><div className="planner-topbar"><Link href={`/trips/${id}/command-center`} className="back-link">‹ Command Center</Link><span className="planner-counter">V9.2 Smart Notifications</span></div><section className="planner-hero notification-hero"><div><span className="eyebrow">RULE-BASED · NO PAID API</span><h1>🔔 Smart Notifications</h1><p>{trip.title} · เตือนจากข้อมูล Booking, Documents, รถเช่า และ Family Profile</p></div><BrowserNotificationButton count={alerts.length}/></section>
<section className="alert-summary-strip"><div><span>High</span><strong>{alerts.filter(a=>a.level==="high").length}</strong></div><div><span>Medium</span><strong>{alerts.filter(a=>a.level==="medium").length}</strong></div><div><span>Low</span><strong>{alerts.filter(a=>a.level==="low").length}</strong></div></section>
<section className="section">{alerts.length?<div className="smart-alert-list">{alerts.map((alert,index)=><article className={`smart-alert-card ${alert.level}`} key={`${alert.title}-${index}`}><span className="smart-alert-symbol">{alert.level==="high"?"!":alert.level==="medium"?"⚠":"i"}</span><div><div className="smart-alert-meta">{alert.group} · {alert.level}</div><h3>{alert.title}</h3><p>{alert.detail}</p>{alert.href&&<Link className="link" href={alert.href}>เปิดหน้าที่เกี่ยวข้อง ›</Link>}</div></article>)}</div>:<div className="success-box">ยังไม่พบรายการเตือนจากข้อมูลที่บันทึกไว้ ✓</div>}</section>
<section className="notice"><span>ℹ️</span><div><strong>ขอบเขตของ V9.2</strong><p>ระบบตรวจแบบ rule-based ตอนเปิดเว็บ/PWA ยังไม่มี background push server หรือ cron จึงไม่มีค่าใช้จ่าย API เพิ่ม</p></div></section>
</div><BottomNav active="/today" tripId={id} /></main>}
