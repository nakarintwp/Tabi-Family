"use client";
import { useEffect, useState } from "react";

type Pack = Record<string, unknown>;

export function TripOfflinePackV9({ tripId, tripTitle, pack }: { tripId: string; tripTitle: string; pack: Pack }) {
  const key = `tabi-trip-pack-${tripId}`;
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(()=>{ try { const row=JSON.parse(localStorage.getItem(key)||"null"); setSavedAt(row?.savedAt || null); } catch {} },[key]);
  async function save(){
    const payload={savedAt:new Date().toISOString(),tripId,tripTitle,...pack};
    localStorage.setItem(key,JSON.stringify(payload));
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const worker = navigator.serviceWorker.controller || registration.active;
        worker?.postMessage({type:"SAVE_TRIP_PACK",tripId,snapshot:payload});
      } catch {}
    }
    setSavedAt(payload.savedAt);
  }
  return <section className="offline-pack-v9"><div><span className="eyebrow">OFFLINE TRIP PACK</span><h2>📴 เก็บทริปนี้ไว้ใช้ออฟไลน์</h2><p>บันทึก Timeline, Booking, Transport, โรงแรม/รถเช่า, เอกสารอ้างอิง และข้อมูลฉุกเฉินลงอุปกรณ์นี้</p>{savedAt && <small>บันทึกล่าสุด {new Date(savedAt).toLocaleString("th-TH")}</small>}</div><button className="btn btn-primary" type="button" onClick={save}>บันทึก Offline Pack</button></section>;
}
