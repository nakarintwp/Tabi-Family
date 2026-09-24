import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";

const phrases = [
  ["ช่วยด้วยครับ/ค่ะ", "助けてください。", "Tasukete kudasai."],
  ["กรุณาเรียกรถพยาบาล", "救急車を呼んでください。", "Kyūkyūsha o yonde kudasai."],
  ["ฉันหลงทาง", "道に迷いました。", "Michi ni mayoimashita."],
  ["ฉันเป็นคนไทย", "私はタイ人です。", "Watashi wa Tai-jin desu."],
  ["กรุณาติดต่อสถานทูตไทย", "タイ大使館に連絡してください。", "Tai taishikan ni renraku shite kudasai."],
];

export default async function EmergencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/emergency`);
  const { data: trip } = await supabase.from("trips").select("id,title,cities").eq("id", id).single();
  if (!trip) notFound();

  return <main className="shell"><div className="container"><AppHeader />
    <div className="planner-topbar"><Link href={`/trips/${id}/more`} className="back-link">‹ More</Link><span className="planner-counter">V8.8 Emergency Japan</span></div>
    <section className="planner-hero v8-emergency-hero"><div><span className="eyebrow">USE WHEN YOU NEED HELP</span><h1>🆘 Emergency Japan</h1><p>{trip.title} · เบอร์ฉุกเฉิน คำพูดภาษาญี่ปุ่น และลิงก์ช่วยเหลือ</p></div></section>

    <section className="emergency-number-grid">
      <a className="emergency-number-card critical" href="tel:110"><span>👮</span><div><small>Police / ตำรวจ</small><strong>110</strong><p>เหตุฉุกเฉินด้านตำรวจ</p></div></a>
      <a className="emergency-number-card critical" href="tel:119"><span>🚑</span><div><small>Fire / Ambulance</small><strong>119</strong><p>ดับเพลิง / รถพยาบาล</p></div></a>
      <a className="emergency-number-card" href="tel:05038162787"><span>🗾</span><div><small>JNTO Visitor Hotline</small><strong>050-3816-2787</strong><p>24 ชม. สำหรับนักท่องเที่ยว</p></div></a>
      <a className="emergency-number-card" href="tel:0357892433"><span>🇹🇭</span><div><small>Royal Thai Embassy, Tokyo</small><strong>03-5789-2433</strong><p>สถานเอกอัครราชทูต ณ กรุงโตเกียว</p></div></a>
    </section>

    <section className="section"><div className="section-head"><h2>คำพูดฉุกเฉิน</h2><span className="small muted">แสดงให้เจ้าหน้าที่ดูได้</span></div><div className="emergency-phrases">{phrases.map(([th, ja, roman]) => <article className="phrase-card" key={th}><strong>{th}</strong><div>{ja}</div><small>{roman}</small></article>)}</div></section>

    <section className="section"><div className="section-head"><h2>ลิงก์ช่วยเหลือ</h2></div><div className="emergency-link-list"><a className="card emergency-link" href="https://www.japan.travel/en/plan/hotline/" target="_blank" rel="noreferrer"><strong>JNTO Japan Visitor Hotline ↗</strong><span>ข้อมูลช่วยเหลือนักท่องเที่ยวและเหตุฉุกเฉิน</span></a><a className="card emergency-link" href="https://www.japan.travel/en/plan/emergencies/" target="_blank" rel="noreferrer"><strong>JNTO Staying Safe in Japan ↗</strong><span>ภัยพิบัติ การแพทย์ และข้อมูลฉุกเฉิน</span></a><a className="card emergency-link" href="https://site.thaiembassy.jp/" target="_blank" rel="noreferrer"><strong>Royal Thai Embassy, Tokyo ↗</strong><span>เว็บไซต์สถานทูตไทยในญี่ปุ่น</span></a></div></section>

    <section className="card emergency-prep"><strong>เตรียมก่อนออกจากโรงแรม</strong><div className="tag-row"><span className="mini-tag">ชื่อโรงแรม + ที่อยู่</span><span className="mini-tag">เลขประกัน</span><span className="mini-tag">เบอร์ติดต่อรถเช่า</span><span className="mini-tag">Passport copy</span><span className="mini-tag">Power bank</span></div><p>เพิ่มข้อมูลเฉพาะทริปไว้ใน Trip Documents และ Booking Center เพื่อเปิดหาได้เร็วเมื่อจำเป็น</p><div className="today-action-row"><Link className="btn btn-primary btn-small" href={`/trips/${id}/documents`}>Trip Documents</Link><Link className="btn btn-secondary btn-small" href={`/trips/${id}/bookings`}>Booking Center</Link></div></section>
  </div><BottomNav active="/more" tripId={id} /></main>;
}
