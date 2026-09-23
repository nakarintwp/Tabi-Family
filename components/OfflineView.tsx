"use client";

import { useEffect, useState } from "react";

type Snapshot = { savedAt?: string; data?: any };

export function OfflineView() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tabi-family-offline-snapshot");
      setSnapshot(raw ? JSON.parse(raw) : null);
    } catch { setSnapshot(null); }
  }, []);

  if (!snapshot?.data) return <div className="empty-state"><div className="empty-icon">📴</div><h2>ออฟไลน์อยู่</h2><p>ยังไม่มีข้อมูล Today ที่บันทึกไว้ในเครื่องนี้ กรุณาเปิดหน้า Today ออนไลน์อย่างน้อยหนึ่งครั้งก่อนเดินทาง</p></div>;

  const model = snapshot.data;
  const activities = model.activities || [];
  return <div className="offline-wrap">
    <div className="offline-banner">📴 Offline Mode · ข้อมูลล่าสุด {snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString("th-TH") : ""}</div>
    <section className="card offline-trip-card"><span className="eyebrow">LAST SAVED PLAN</span><h1>{model.tripTitle || "Tabi Family"}</h1><p>{model.dayTitle || model.tripDate || "Today"}</p></section>
    <section className="section"><h2>แผนที่บันทึกไว้</h2>{activities.length ? <div className="today-timeline">{activities.map((a:any) => <article className="today-activity" key={a.id}><div className="today-time">{a.start_time?.slice(0,5) || "—"}</div><div className="today-dot">○</div><div className="today-activity-copy"><strong>{a.title}</strong>{a.location_name && <small>{a.location_name}</small>}{a.maps_url && <a href={a.maps_url} target="_blank" rel="noreferrer">เปิดสถานที่ ↗</a>}</div></article>)}</div> : <div className="empty-mini">ไม่มีรายการกิจกรรมใน snapshot ล่าสุด</div>}</section>
  </div>;
}
