"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { shiftRemainingActivities } from "@/app/today/actions";
import { minutesToTime, timeToMinuteValue } from "@/lib/v10";

type Activity = { id:string; title:string; start_time?:string|null; duration_minutes?:number|null; location_name?:string|null; maps_url?:string|null; status?:string|null };
type Transport = { id:string; mode:string; origin:string; destination:string; departure_time?:string|null; arrival_time?:string|null };
type Booking = { id:string; booking_type:string; title?:string|null; provider?:string|null; start_at?:string|null };

function japanMinute(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone:"Asia/Tokyo", hour:"2-digit", minute:"2-digit", hour12:false }).formatToParts(date);
  const h = Number(parts.find((p)=>p.type==="hour")?.value || 0); const m = Number(parts.find((p)=>p.type==="minute")?.value || 0); return h*60+m;
}
function bookingMinute(value?:string|null) {
  if (!value) return null;
  try { const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Tokyo",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(value)); const h=Number(parts.find((p)=>p.type==="hour")?.value||0); const m=Number(parts.find((p)=>p.type==="minute")?.value||0); return h*60+m; } catch { return timeToMinuteValue(value.slice(11,16)); }
}
function mapsUrl(activity?: Activity | null) { if (!activity) return ""; return activity.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location_name || activity.title)}`; }

export function LiveTripControl({ tripId, dayId, canEdit, activities, transports, bookings }: { tripId:string; dayId:string; canEdit:boolean; activities:Activity[]; transports:Transport[]; bookings:Booking[] }) {
  const router = useRouter();
  const [now,setNow]=useState<Date|null>(null); const [delay,setDelay]=useState(0); const [applying,setApplying]=useState(false); const [message,setMessage]=useState("");
  useEffect(()=>{ setNow(new Date()); const timer=window.setInterval(()=>setNow(new Date()),30000); const saved=Number(window.localStorage.getItem(`tabi-delay-${tripId}-${dayId}`)||0); if(Number.isFinite(saved))setDelay(saved); return()=>window.clearInterval(timer); },[tripId,dayId]);
  useEffect(()=>{ if(typeof window!=="undefined") window.localStorage.setItem(`tabi-delay-${tripId}-${dayId}`,String(delay)); },[delay,tripId,dayId]);

  const model=useMemo(()=>{
    if(!now) return null; const current=japanMinute(now);
    const planned=activities.filter((a)=>(a.status||"planned")==="planned");
    const timed=planned.map((a)=>({item:a,start:timeToMinuteValue(a.start_time)})).filter((x):x is {item:Activity;start:number}=>x.start!=null).sort((a,b)=>a.start-b.start);
    const currentActivity=timed.find((x)=>current>=x.start && current<x.start+Math.max(15,x.item.duration_minutes||60));
    const currentTransport=transports.map((t)=>({item:t,start:timeToMinuteValue(t.departure_time),end:timeToMinuteValue(t.arrival_time)})).find((x)=>x.start!=null&&x.end!=null&&current>=x.start&&current<x.end);
    const nextActivity=timed.find((x)=>x.start>=current)?.item || planned.find((a)=>!a.start_time) || null;
    const fixed=[...transports.map((t)=>({minute:timeToMinuteValue(t.departure_time),label:`${t.mode}: ${t.origin} → ${t.destination}`})),...bookings.map((b)=>({minute:bookingMinute(b.start_at),label:b.title||b.provider||b.booking_type}))].filter((x):x is {minute:number;label:string}=>x.minute!=null).sort((a,b)=>a.minute-b.minute);
    const shifted=timed.filter((x)=>x.start>=current).map((x)=>({ ...x, shiftedStart:x.start+delay, shiftedEnd:x.start+delay+Math.max(15,x.item.duration_minutes||60) }));
    const risks:string[]=[];
    for(const row of shifted){ const nextFixed=fixed.find((f)=>f.minute>=row.start && f.minute<=row.shiftedEnd+30); if(nextFixed) risks.push(`${row.item.title} อาจชน ${nextFixed.label} เวลา ${minutesToTime(nextFixed.minute)}`); if(row.shiftedEnd>22*60+30) risks.push(`${row.item.title} เลื่อนไปถึง ${minutesToTime(row.shiftedEnd)} ควรตรวจเวลาปิด`); }
    return {current,currentActivity,currentTransport,nextActivity,shifted,risks:[...new Set(risks)]};
  },[now,activities,transports,bookings,delay]);

  async function applyDelay(){ if(!model||!delay||!canEdit)return; setApplying(true);setMessage(""); try{ const data=new FormData(); data.set("trip_id",tripId);data.set("day_id",dayId);data.set("from_time",minutesToTime(model.current));data.set("minutes",String(delay));await shiftRemainingActivities(data);setDelay(0);setMessage("ปรับเวลาของกิจกรรมที่เหลือแล้ว ✓");router.refresh();}catch(e){setMessage(e instanceof Error?e.message:"ปรับเวลาไม่สำเร็จ");}finally{setApplying(false);} }
  if(!now||!model) return null;
  const status = model.currentTransport ? {icon:"🚆",title:"กำลังเดินทาง",detail:`${model.currentTransport.item.origin} → ${model.currentTransport.item.destination}`} : model.currentActivity ? {icon:"▶",title:"กำลังทำ",detail:model.currentActivity.item.title} : model.nextActivity ? {icon:"⏱",title:"รอรายการถัดไป",detail:model.nextActivity.title} : {icon:"✓",title:"แผนหลักวันนี้ครบแล้ว",detail:"ตรวจ Booking / การเดินทางที่เหลือ"};
  return <section className="section live-trip-control"><div className="section-head"><div><span className="eyebrow">V10.4 LIVE TRIP STATUS</span><h2>{status.icon} {status.title}</h2></div><span className="live-japan-clock">JST {minutesToTime(model.current)}</span></div><div className="live-status-card"><div><strong>{status.detail}</strong>{model.nextActivity?.location_name&&<small>📍 {model.nextActivity.location_name}</small>}</div>{model.nextActivity&&<a className="btn btn-secondary btn-small" href={mapsUrl(model.nextActivity)} target="_blank" rel="noreferrer">Navigate ↗</a>}</div>
    <div className="delay-replanner"><div className="section-head"><div><span className="eyebrow">V10.5 DELAY REPLANNER</span><h3>ถ้าช้ากว่าแผน</h3></div><strong>{delay>0?`+${delay} นาที`:"ตรงเวลา"}</strong></div><div className="delay-buttons"><button type="button" onClick={()=>setDelay(15)}>+15</button><button type="button" onClick={()=>setDelay(30)}>+30</button><button type="button" onClick={()=>setDelay(60)}>+60</button><button type="button" onClick={()=>setDelay(0)}>Reset</button></div>
      {delay>0&&<div className="delay-preview">{model.shifted.slice(0,5).map((row)=><div key={row.item.id}><span>{minutesToTime(row.start)} → <b>{minutesToTime(row.shiftedStart)}</b></span><strong>{row.item.title}</strong></div>)}</div>}
      {model.risks.length>0&&delay>0&&<div className="delay-risk-box"><strong>⚠️ จุดที่ควรตรวจ</strong>{model.risks.slice(0,5).map((risk)=><p key={risk}>{risk}</p>)}</div>}
      {canEdit&&delay!==0&&<button type="button" className="btn btn-primary btn-full" disabled={applying} onClick={applyDelay}>{applying?"กำลังปรับเวลา...":`ใช้ Delay ${delay>0?"+":""}${delay} นาที กับกิจกรรมที่เหลือ`}</button>}{message&&<div className="form-alert form-alert-success">{message}</div>}
      <small className="muted">Booking และเวลา Transport ถือเป็นเวลาคงที่ ระบบจะเลื่อนเฉพาะกิจกรรมที่ยังไม่เสร็จและมีเวลาเริ่มต้น</small></div>
  </section>;
}
