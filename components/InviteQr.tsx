"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function InviteQr({ url, label }: { url: string; label: string }) {
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((value) => {
      if (alive) setSrc(value);
    }).catch(() => {
      if (alive) setSrc("");
    });
    return () => { alive = false; };
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: `Tabi Family · ${label}`, text: "สแกนหรือเปิดลิงก์เพื่อเข้าร่วมทริป", url });
      return;
    }
    await copyLink();
  }

  return (
    <div className="invite-qr-card">
      <div className="invite-qr-frame">
        {src ? <img src={src} alt={`QR Code สำหรับ ${label}`} /> : <div className="qr-loading">กำลังสร้าง QR…</div>}
      </div>
      <div className="invite-link-box">{url}</div>
      <div className="invite-qr-actions">
        <button type="button" className="btn btn-secondary btn-small" onClick={copyLink}>{copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}</button>
        <button type="button" className="btn btn-primary btn-small" onClick={shareLink}>แชร์</button>
      </div>
    </div>
  );
}
