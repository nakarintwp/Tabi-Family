import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

const rows = [
  ["✈️","Thai Airways","BKK → NRT · Booking ABC123"],
  ["🏨","Hotel Gracery Shinjuku","10–13 Nov · 3 nights"],
  ["🚆","Tokyo → Kyoto","Nozomi · Car 8 · Seats 7A–7D"],
  ["🎟️","Tokyo DisneySea","4 tickets · QR saved"],
];

export default function WalletPage() {
  return <main className="shell"><div className="container"><AppHeader />
    <h1 className="page-title">Trip Wallet</h1><p className="page-subtitle">รวม booking, ticket และข้อมูลสำคัญไว้ในหน้าที่เปิดง่ายบนมือถือ</p>
    <div className="card">{rows.map(([icon,title,meta]) => <div className="wallet-row" key={title}><div className="wallet-icon">{icon}</div><div><div className="activity-title">{title}</div><div className="activity-meta">{meta}</div></div><span>›</span></div>)}</div>
    <section className="section"><div className="section-head"><h2>Budget</h2><span className="link">62%</span></div><div className="card"><strong style={{fontSize:24}}>฿92,480</strong><div className="activity-meta">จากงบ ฿150,000 · เหลือ ฿57,520</div><div className="progress"><i style={{width:"62%"}}/></div></div></section>
  </div><BottomNav active="/wallet" /></main>;
}
