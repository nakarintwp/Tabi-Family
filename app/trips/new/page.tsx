import Link from "next/link";
import { randomUUID } from "node:crypto";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SubmitButton } from "@/components/SubmitButton";
import { DEFAULT_TRIP_INTERESTS, DISCOVERY_DESTINATIONS, TRIP_INTERESTS, getTemplate } from "@/lib/discovery";
import { createTrip } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string; template?: string }> }) {
  const { error, template: templateId } = await searchParams;
  const template = templateId ? getTemplate(templateId) : undefined;
  const createRequestId = randomUUID();
  const selectedCities = new Set(template?.cities || ["Nagoya", "Takayama", "Shirakawa-go"]);
  const selectedInterests = new Set(DEFAULT_TRIP_INTERESTS);

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <div className="page-heading-row">
          <div>
            <div className="eyebrow">{template ? "Template journey" : "New journey"}</div>
            <h1 className="page-title">สร้างทริปใหม่</h1>
            <p className="page-subtitle">{template ? `ใช้ ${template.title} เป็นจุดเริ่มต้น แล้วแก้ต่อได้ทุกจุด` : "สร้าง Trip, สมาชิก และวันเดินทางในครั้งเดียว"}</p>
          </div>
          <div className="create-version-stack"><div className="speed-chip">⚡ Fast create</div><div className="build-chip">V7.3.5</div></div>
        </div>

        {template && <div className={`template-selected trip-cover cover-${template.coverStyle}`}><span>{template.coverEmoji}</span><div><strong>{template.title}</strong><small>{template.days} วัน · {template.cities.join(" • ")}</small></div><Link className="link" href="/templates">เปลี่ยน</Link></div>}
        {error && <div className="error-box">⚠️ {error}</div>}

        <form className="form-card" action={createTrip}>
          <input type="hidden" name="create_request_id" value={createRequestId} />
          <input type="hidden" name="template_id" value={template?.id || ""} />
          <div className="field">
            <label htmlFor="title">ชื่อทริป</label>
            <input className="input" id="title" name="title" defaultValue={template?.title || "Japan Family Trip 2026"} required />
          </div>

          <div className="grid2">
            <div className="field"><label htmlFor="start_date">วันเริ่ม</label><input className="input" id="start_date" name="start_date" type="date" required /></div>
            <div className="field"><label htmlFor="end_date">วันกลับ</label><input className="input" id="end_date" name="end_date" type="date" required /></div>
          </div>
          {template && <p className="small muted form-hint">Template นี้ออกแบบไว้ประมาณ {template.days} วัน — หากเลือกวันน้อยกว่า ระบบจะใส่เฉพาะ Day ที่มีอยู่</p>}

          <div className="field selection-panel">
            <div className="selection-section-title"><div><span className="selection-step">1</span><strong>เมือง / พื้นที่ที่จะไป</strong></div><span>ติ๊กเลือกได้หลายเมือง</span></div><p className="selection-note">เลือกพื้นที่ของทริปก่อน เพื่อให้ Explore แสดงเฉพาะสถานที่ที่เกี่ยวข้องกับเส้นทางนี้</p>
            <div className="destination-picker">
              {DISCOVERY_DESTINATIONS.map((destination) => (
                <label className="destination-option" key={destination.id}>
                  <input type="checkbox" name="cities" value={destination.id} defaultChecked={selectedCities.has(destination.id)} />
                  <span className="destination-option-emoji">{destination.emoji}</span>
                  <span><strong>{destination.label}</strong><small>{destination.subtitle}</small></span>
                </label>
              ))}
            </div>
            <p className="small muted form-hint">ตัวอย่างทริป Chubu: Nagoya → Takayama → Shirakawa-go เมื่อเข้า Explore จะเห็นเฉพาะพื้นที่ของทริปนี้</p>
          </div>

          <div className="field selection-panel">
            <div className="selection-section-title"><div><span className="selection-step">2</span><strong>กิจกรรมที่สนใจ</strong></div><span>เลือกได้หลายแบบ</span></div><p className="selection-note">ระบบจะใช้ความสนใจเหล่านี้จัดลำดับคำแนะนำใน Explore ให้ตรงกับทริปมากขึ้น</p>
            <div className="interest-picker">
              {TRIP_INTERESTS.map((interest) => (
                <label className="interest-option" key={interest.id}>
                  <input type="checkbox" name="interests" value={interest.id} defaultChecked={selectedInterests.has(interest.id)} />
                  <span className="interest-option-emoji">{interest.emoji}</span>
                  <span><strong>{interest.label}</strong><small>{interest.subtitle}</small></span>
                </label>
              ))}
            </div>
            <p className="small muted form-hint">เลือกได้หลายแบบ เช่น ❄️ หิมะ · 🎡 สวนสนุก · 🛍️ ช้อปปิ้ง · 📍 สถานที่เที่ยวชม · 🍎 ตลาด</p>
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="pace">สไตล์ทริป</label>
              <select className="select" id="pace" name="pace" defaultValue={template?.pace || "balanced"}>
                <option value="relaxed">Relaxed — เน้นสบาย</option>
                <option value="balanced">Balanced — สมดุล</option>
                <option value="packed">Packed — เก็บหลายจุด</option>
              </select>
            </div>
            <div className="field"><label htmlFor="budget">งบประมาณ (บาท)</label><input className="input" id="budget" name="budget" type="number" min="0" step="100" placeholder="150000" /></div>
          </div>

          <div className="section-head compact-head"><h2>สมาชิกครอบครัว</h2><span className="small muted">แก้รายละเอียดได้ภายหลัง</span></div>
          <div className="grid3">
            <div className="field"><label htmlFor="adults">ผู้ใหญ่</label><input className="input" id="adults" name="adults" type="number" min="0" max="10" defaultValue="2" /></div>
            <div className="field"><label htmlFor="children">เด็ก</label><input className="input" id="children" name="children" type="number" min="0" max="10" defaultValue="1" /></div>
            <div className="field"><label htmlFor="seniors">ผู้สูงอายุ</label><input className="input" id="seniors" name="seniors" type="number" min="0" max="10" defaultValue="0" /></div>
          </div>

          <SubmitButton className="btn btn-primary btn-full" pendingText="กำลังสร้างทริป...">{template ? "สร้างทริปจาก Template" : "สร้างทริปและวันเดินทาง"}</SubmitButton>
          <p className="small muted form-hint">ระบบป้องกันการสร้างซ้ำจากการกดหรือการส่งคำขอซ้ำ และจะพาไป Trip Dashboard อัตโนมัติ</p>
        </form>

        <p className="small center-copy"><Link href="/templates" className="link">ดู Templates</Link> · <Link href="/trips" className="link">ดูทริปทั้งหมด</Link></p>
      </div>
      <BottomNav active="/trips" />
    </main>
  );
}
