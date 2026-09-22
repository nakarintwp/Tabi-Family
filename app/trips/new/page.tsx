import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { createTrip } from "./actions";

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="shell">
      <div className="container">
        <AppHeader />
        <h1 className="page-title">สร้างทริปใหม่</h1>
        <p className="page-subtitle">สร้างข้อมูลจริงใน Supabase พร้อมสมาชิกครอบครัวและวันเดินทางอัตโนมัติ</p>

        {error && <div className="error-box">⚠️ {error}</div>}

        <form className="form-card" action={createTrip}>
          <div className="field">
            <label htmlFor="title">ชื่อทริป</label>
            <input className="input" id="title" name="title" defaultValue="Japan Family Trip 2026" required />
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="start_date">วันเริ่ม</label>
              <input className="input" id="start_date" name="start_date" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="end_date">วันกลับ</label>
              <input className="input" id="end_date" name="end_date" type="date" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="cities">เมือง (คั่นด้วย comma)</label>
            <input className="input" id="cities" name="cities" defaultValue="Tokyo, Fuji, Kyoto, Osaka" required />
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="pace">สไตล์ทริป</label>
              <select className="select" id="pace" name="pace" defaultValue="balanced">
                <option value="relaxed">Relaxed — เน้นสบาย</option>
                <option value="balanced">Balanced — สมดุล</option>
                <option value="packed">Packed — เก็บหลายจุด</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="budget">งบประมาณ (บาท)</label>
              <input className="input" id="budget" name="budget" type="number" min="0" step="100" placeholder="150000" />
            </div>
          </div>

          <div className="section-head compact-head"><h2>สมาชิกครอบครัว</h2><span className="small muted">แก้ชื่อและรายละเอียดเพิ่มได้ภายหลัง</span></div>
          <div className="grid3">
            <div className="field"><label htmlFor="adults">ผู้ใหญ่</label><input className="input" id="adults" name="adults" type="number" min="0" max="10" defaultValue="2" /></div>
            <div className="field"><label htmlFor="children">เด็ก</label><input className="input" id="children" name="children" type="number" min="0" max="10" defaultValue="1" /></div>
            <div className="field"><label htmlFor="seniors">ผู้สูงอายุ</label><input className="input" id="seniors" name="seniors" type="number" min="0" max="10" defaultValue="1" /></div>
          </div>

          <button className="btn btn-primary btn-full" type="submit">สร้างทริปและวันเดินทาง</button>
          <p className="small muted" style={{ marginBottom: 0 }}>ระบบจะสร้าง Day 1, Day 2 … ตามช่วงวันที่ให้โดยอัตโนมัติ</p>
        </form>

        <p className="small" style={{ textAlign: "center", marginTop: 14 }}>
          <Link href="/trips" className="link">ดูทริปทั้งหมด</Link>
        </p>
      </div>
      <BottomNav active="/trips/new" />
    </main>
  );
}
