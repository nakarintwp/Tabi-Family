"use client";

import { useEffect, useState } from "react";

type DocItem = { title: string; reference?: string | null; url?: string | null; note?: string | null };

export function DocumentOfflinePack({ tripId, items }: { tripId: string; items: DocItem[] }) {
  const key = `tabi-doc-pack-${tripId}`;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(Boolean(window.localStorage.getItem(key)));
  }, [key]);

  function save() {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), items }));
    setSaved(true);
  }

  function clear() {
    window.localStorage.removeItem(key);
    setSaved(false);
  }

  return <div className="offline-doc-pack">
    <div><strong>Offline reference pack</strong><p>เก็บชื่อเอกสาร เลขจอง หมายเหตุ และ URL ไว้ในเครื่องนี้ เผื่ออินเทอร์เน็ตไม่พร้อม</p></div>
    <div className="today-action-row"><button type="button" className="btn btn-primary btn-small" onClick={save}>{saved ? "✓ บันทึกในเครื่องแล้ว" : "บันทึกไว้ Offline"}</button>{saved && <button type="button" className="btn btn-secondary btn-small" onClick={clear}>ล้าง Offline pack</button>}</div>
    <small>หมายเหตุ: ฟังก์ชันนี้เก็บข้อมูลอ้างอิง ไม่ได้ดาวน์โหลดไฟล์จากลิงก์ภายนอกมาไว้ Offline</small>
  </div>;
}
