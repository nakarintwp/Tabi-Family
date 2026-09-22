import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default function HomePage() {
  return (
    <main className="shell">
      <div className="container">
        <AppHeader />

        <section className="hero">
          <div className="eyebrow">Japan family trip</div>
          <h1>Tokyo • Fuji • Kyoto • Osaka</h1>
          <p>10–18 Nov 2026 · 9 days / 8 nights</p>
          <div className="hero-row">
            <div className="hero-stat"><strong>Day 3 of 9</strong><span>Tokyo → Kawaguchiko</span></div>
            <div className="pill">☀️ 21°C</div>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>ถัดไป</h2><Link className="link" href="/plan">ดูแผนวันนี้</Link></div>
          <Link href="/plan" className="card next-card">
            <div className="timebox"><strong>09:10</strong><span>32 นาที</span></div>
            <div><div className="activity-title">🚆 Shinjuku Station</div><div className="activity-meta">JR Chuo Line · Platform 9<br/>ไป Kawaguchiko</div></div>
            <span className="arrow">›</span>
          </Link>
        </section>

        <section className="section">
          <div className="section-head"><h2>ภาพรวมทริป</h2><span className="link">Family Pace 😊</span></div>
          <div className="grid2">
            <div className="card metric"><span className="metric-icon">💴</span><strong>฿92,480</strong><span>ใช้ไปจาก ฿150,000</span><div className="progress"><i style={{ width: "62%" }} /></div></div>
            <div className="card metric"><span className="metric-icon">🚶</span><strong>7.4 km</strong><span>เดินวันนี้ · ~10,500 ก้าว</span><div className="progress"><i style={{ width: "48%" }} /></div></div>
          </div>
        </section>

        <section className="section">
          <div className="notice"><span>🌧️</span><div><strong>ฝนอาจตกช่วง 14:00–18:00</strong><br/><span className="muted">แนะนำให้ย้ายกิจกรรมกลางแจ้งไปช่วงเช้า และเก็บแผนสำรองในร่มไว้</span></div></div>
        </section>

        <section className="section">
          <div className="section-head"><h2>สมาชิกครอบครัว</h2><span className="link">4 คน</span></div>
          <div className="family">
            <div className="person"><div className="face">👨</div><strong>Dad</strong><small>เดินปกติ</small></div>
            <div className="person"><div className="face">👩</div><strong>Mom</strong><small>Food lover</small></div>
            <div className="person"><div className="face">👧</div><strong>Mimi</strong><small>พักบ่อย</small></div>
            <div className="person"><div className="face">👵</div><strong>Grandma</strong><small>Easy pace</small></div>
          </div>
        </section>
      </div>
      <BottomNav active="/" />
    </main>
  );
}
