"use client";
import { useState } from "react";

export function BrowserNotificationButton({ count }: { count: number }) {
  const [status,setStatus]=useState<string>("");
  async function enable(){
    if (!("Notification" in window)) { setStatus("เบราว์เซอร์นี้ไม่รองรับ Notification"); return; }
    const permission=await Notification.requestPermission();
    if(permission==="granted") { new Notification("Tabi Family",{body: count ? `มี ${count} รายการที่ควรตรวจในทริป` : "ยังไม่มีรายการเตือนสำคัญ"}); setStatus("เปิดสิทธิ์ Notification แล้ว"); }
    else setStatus("ยังไม่ได้อนุญาต Notification");
  }
  return <div className="browser-notify-box"><button className="btn btn-secondary" type="button" onClick={enable}>เปิด Browser Notification</button>{status && <small>{status}</small>}<p className="small muted">เวอร์ชันนี้แจ้งเตือนเมื่อเปิดเว็บ/PWA ไม่ใช่ background push server จึงไม่มีค่า API เพิ่ม</p></div>;
}
