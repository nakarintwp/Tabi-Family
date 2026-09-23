"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstallCard() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [cleared, setCleared] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);
    const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const install = async () => { if (!promptEvent) return; await promptEvent.prompt(); await promptEvent.userChoice; setPromptEvent(null); };
  const clearOffline = async () => {
    try { localStorage.removeItem("tabi-family-offline-snapshot"); const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); setCleared(true); } catch {}
  };
  return <section className="card pwa-install-card"><div><strong>📱 ติดตั้ง Tabi Family</strong><p className="small muted">เพิ่มลงหน้าจอมือถือและใช้ Offline snapshot ของ Today ได้</p></div>{standalone ? <span className="badge success">ติดตั้งแล้ว</span> : promptEvent ? <button className="btn btn-primary btn-small" onClick={install}>ติดตั้งแอป</button> : <small className="muted">บน iPhone: Share → Add to Home Screen</small>}<button className="text-button" onClick={clearOffline}>{cleared ? "ล้าง Offline data แล้ว ✓" : "ล้าง Offline data ในเครื่องนี้"}</button></section>;
}
