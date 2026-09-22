import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { createTrip } from "./actions";

export default function NewTripPage() {
  return <main className="shell"><div className="container"><AppHeader />
    <h1 className="page-title">สร้างทริปใหม่</h1><p className="page-subtitle">เวอร์ชัน MVP เก็บข้อมูลหลักก่อน แล้วค่อยต่อ AI itinerary / Maps / Weather ในขั้นถัดไป</p>
    <form className="form-card" action={createTrip}>
      <div className="field"><label htmlFor="title">ชื่อทริป</label><input className="input" id="title" name="title" defaultValue="Japan Family Trip 2026" /></div>
      <div className="grid2"><div className="field"><label htmlFor="start_date">วันเริ่ม</label><input className="input" id="start_date" name="start_date" type="date" /></div><div className="field"><label htmlFor="end_date">วันกลับ</label><input className="input" id="end_date" name="end_date" type="date" /></div></div>
      <div className="field"><label htmlFor="cities">เมือง (คั่นด้วย comma)</label><input className="input" id="cities" name="cities" defaultValue="Tokyo, Fuji, Kyoto, Osaka" /></div>
      <div className="field"><label htmlFor="pace">สไตล์ทริป</label><select className="select" id="pace" name="pace" defaultValue="balanced"><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="packed">Packed</option></select></div>
      <button className="btn btn-primary btn-full" type="submit">สร้างทริป</button>
      <p className="small muted">ยังไม่ต่อ Supabase? ปุ่มนี้จะกลับไปหน้า Demo โดยไม่ทำให้แอปล่ม</p>
    </form>
    <p className="small" style={{textAlign:"center",marginTop:14}}><Link href="/auth/login" className="link">เชื่อมบัญชี Supabase Auth</Link></p>
  </div><BottomNav active="/trips/new" /></main>;
}
