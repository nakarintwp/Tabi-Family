"use client";
import { useEffect, useMemo, useState } from "react";

const ITEMS = [
  "เอกสารสำหรับขับรถในญี่ปุ่นพร้อม",
  "ตรวจเวลารับรถ / คืนรถ",
  "ยืนยัน ETC card / วิธีชำระทางด่วน",
  "ยืนยัน Snow tire / chain ถ้าเส้นทางมีหิมะ",
  "บันทึกจุดคืนรถใน Google Maps",
  "เช็กเงื่อนไขน้ำมันก่อนคืนรถ",
  "เช็กที่จอดรถของโรงแรม/สถานที่",
  "ถ่ายรูปรถก่อนออกและก่อนคืน",
] as const;

export function DrivingChecklist({ tripId }: { tripId: string }) {
  const key = `tabi-driving-checklist-${tripId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(()=>{ try { setChecked(JSON.parse(localStorage.getItem(key) || "{}")); } catch {} }, [key]);
  const done = useMemo(()=>ITEMS.filter((x)=>checked[x]).length,[checked]);
  function toggle(item: string){ const next={...checked,[item]:!checked[item]}; setChecked(next); localStorage.setItem(key,JSON.stringify(next)); }
  return <section className="section driving-checklist"><div className="section-head"><h2>Pre-drive checklist</h2><span className="small muted">{done}/{ITEMS.length}</span></div><div className="checklist-stack">{ITEMS.map((item)=><label key={item} className={`checklist-row ${checked[item] ? "done" : ""}`}><input type="checkbox" checked={!!checked[item]} onChange={()=>toggle(item)}/><span>{item}</span></label>)}</div><p className="small muted">Checklist นี้บันทึกเฉพาะในอุปกรณ์นี้ ไม่ใช่เอกสารกฎหมายหรือคำแนะนำจากบริษัทเช่ารถ</p></section>;
}
