import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default function MapPage() {
  return <main className="shell"><div className="container"><AppHeader />
    <h1 className="page-title">แผนที่ทริป</h1><p className="page-subtitle">โครงสร้างพร้อมต่อ Google Maps/Maps provider ภายหลัง โดย MVP นี้แสดง route concept ก่อน</p>
    <div className="map-placeholder">
      <div className="pin" style={{left:"18%",top:"25%"}}><span>🏨</span></div>
      <div className="pin" style={{left:"55%",top:"34%"}}><span>🚆</span></div>
      <div className="pin" style={{left:"64%",top:"63%"}}><span>🗻</span></div>
      <div className="pin" style={{left:"27%",top:"70%"}}><span>🍜</span></div>
    </div>
    <div className="section card"><strong>Route tip</strong><p className="activity-meta">วันนี้มี 2 transfers · เดินประมาณ 7.4 km · เหมาะกับเด็กและผู้สูงอายุเมื่อมีช่วงพักกลางวัน</p></div>
  </div><BottomNav active="/map" /></main>;
}
