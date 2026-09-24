export type SmartActivity = { id:string; title:string; start_time?:string|null; duration_minutes?:number|null; is_outdoor?:boolean|null; rain_alternative?:string|null; status?:string|null; location_name?:string|null };
export type SmartDay = { id:string; trip_date:string; title?:string|null; activities?:SmartActivity[] };
export type SmartBooking = { id:string; booking_type:string; title?:string|null; provider?:string|null; reference_code?:string|null; start_at?:string|null; end_at?:string|null; details?:Record<string,unknown>|null };
export type SmartTransport = { id:string; day_id?:string|null; mode:string; origin:string; destination:string; departure_time?:string|null; arrival_time?:string|null; booking_reference?:string|null; distance_km?:number|null; toll_jpy?:number|null; fuel_jpy?:number|null; parking_jpy?:number|null; rest_stop?:string|null; winter_ready?:boolean|null };

function mins(v?:string|null){ if(!v) return null; const [h,m]=v.slice(0,5).split(':').map(Number); return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null; }
function bookingDate(v?:string|null){ return v ? v.slice(0,10) : ''; }
function detail(details:Record<string,unknown>|null|undefined,key:string){ const v=details?.[key]; return typeof v==='string'||typeof v==='number'||typeof v==='boolean'?String(v):''; }

export type SmartIssue = { level:'high'|'medium'|'info'; title:string; detail:string; href?:string };

export function buildTripEngineIssues(tripId:string, days:SmartDay[], bookings:SmartBooking[], transports:SmartTransport[]) {
  const issues:SmartIssue[]=[];
  for (const day of days) {
    const acts=[...(day.activities||[])].filter(a=>(a.status||'planned')==='planned').sort((a,b)=>(mins(a.start_time)??9999)-(mins(b.start_time)??9999));
    for(let i=0;i<acts.length-1;i++){
      const a=acts[i], b=acts[i+1]; const aStart=mins(a.start_time), bStart=mins(b.start_time);
      if(aStart!==null && bStart!==null){
        const end=aStart+Number(a.duration_minutes||60); const gap=bStart-end;
        if(gap<0) issues.push({level:'high',title:`เวลาชนกัน · ${day.trip_date}`,detail:`${a.title} ทับกับ ${b.title} ประมาณ ${Math.abs(gap)} นาที`,href:`/trips/${tripId}/calendar`});
        else if(gap<20) issues.push({level:'medium',title:`Buffer น้อย · ${day.trip_date}`,detail:`มีเวลาเพียง ${gap} นาทีระหว่าง ${a.title} และ ${b.title}`,href:`/trips/${tripId}/calendar`});
      }
    }
    if(acts.length>=7) issues.push({level:'medium',title:`วันค่อนข้างแน่น · ${day.trip_date}`,detail:`มี ${acts.length} กิจกรรมที่ยังวางแผนไว้`,href:`/trips/${tripId}/calendar`});
  }
  for(const booking of bookings.filter(b=>b.booking_type!=='document')){
    if(!booking.reference_code) issues.push({level:'medium',title:'Booking ไม่มีเลขอ้างอิง',detail:booking.title||booking.provider||booking.booking_type,href:`/trips/${tripId}/bookings`});
    const payment=detail(booking.details,'payment_status');
    if(payment && !['paid','complete','completed'].includes(payment.toLowerCase())) issues.push({level:'info',title:'ตรวจสถานะการชำระเงิน',detail:`${booking.title||booking.provider||booking.booking_type} · ${payment}`,href:`/trips/${tripId}/bookings`});
  }
  for(const t of transports){
    const day=days.find(d=>d.id===t.day_id); const date=day?.trip_date||'';
    if(t.mode==='car' && Number(t.distance_km||0)>=250) issues.push({level:'medium',title:`วันขับรถไกล${date?` · ${date}`:''}`,detail:`${t.origin} → ${t.destination} · ${Number(t.distance_km).toLocaleString()} km`,href:`/trips/${tripId}/driving`});
    if(t.mode==='car' && !t.winter_ready) issues.push({level:'info',title:'ยังไม่ได้ยืนยัน Winter driving',detail:`${t.origin} → ${t.destination} · ตรวจ Snow tire/สภาพถนนเมื่อเดินทางฤดูหนาว`,href:`/trips/${tripId}/driving`});
  }
  const sorted=issues.sort((a,b)=>({high:3,medium:2,info:1}[b.level]-{high:3,medium:2,info:1}[a.level]));
  return sorted;
}

export function buildWeatherSuggestions(day:{date:string;code:number;tempMin:number|null;tempMax:number|null;precipitationProbability:number|null}, activities:SmartActivity[]) {
  const wet=(day.precipitationProbability??0)>=45 || [51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(day.code);
  const snow=[71,73,75,77,85,86].includes(day.code);
  const cold=(day.tempMin??99)<=2;
  const outdoor=activities.filter(a=>a.is_outdoor && (a.status||'planned')==='planned');
  const indoor=activities.filter(a=>!a.is_outdoor && (a.status||'planned')==='planned');
  const tips:string[]=[];
  if(wet && outdoor.length) tips.push(`มี ${outdoor.length} กิจกรรมกลางแจ้ง — เตรียม Rain/Snow alternative`);
  if(wet && indoor.length) tips.push(`กิจกรรม Indoor ${indoor.slice(0,2).map(a=>a.title).join(' / ')} เหมาะสำหรับช่วงฝนหรือหิมะ`);
  if(snow) tips.push('มีสัญญาณหิมะในพยากรณ์ — เผื่อเวลาเดินทางและตรวจระบบขนส่ง/ถนนอีกครั้ง');
  if(cold) tips.push(`อุณหภูมิต่ำสุดประมาณ ${day.tempMin}°C — เตรียมเสื้อกันหนาวและรองเท้าที่เหมาะสม`);
  if(!tips.length) tips.push('สภาพอากาศยังไม่สร้างข้อเตือนพิเศษจากข้อมูลพยากรณ์ชุดนี้');
  return {wet,snow,cold,tips,outdoor,indoor};
}

export function drivingTotals(segments:SmartTransport[]) {
  return segments.reduce((a,s)=>({
    distance:a.distance+Number(s.distance_km||0), toll:a.toll+Number(s.toll_jpy||0), fuel:a.fuel+Number(s.fuel_jpy||0), parking:a.parking+Number(s.parking_jpy||0),
  }),{distance:0,toll:0,fuel:0,parking:0});
}

export function bookingInboxStatus(booking:SmartBooking){
  const d=booking.details||{}; const linked=Boolean(d.linked_booking_id||d.linked_document_id); const reviewed=Boolean(d.reviewed_at);
  if(booking.booking_type==='document') return {pending:!linked, reason:linked?'Linked':'เอกสารยังไม่ผูก Booking'};
  if(!booking.reference_code) return {pending:true,reason:'ยังไม่มี Booking reference'};
  if(!reviewed && Boolean(d.auto_import_v10)) return {pending:true,reason:'Auto Import รอตรวจสอบ'};
  return {pending:false,reason:'พร้อมใช้งาน'};
}
