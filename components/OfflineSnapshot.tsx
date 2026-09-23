"use client";

import { useEffect } from "react";

export function OfflineSnapshot({ data }: { data: unknown }) {
  useEffect(() => {
    try {
      localStorage.setItem("tabi-family-offline-snapshot", JSON.stringify({ savedAt: new Date().toISOString(), data }));
      navigator.serviceWorker?.controller?.postMessage({ type: "SAVE_SNAPSHOT", snapshot: data });
    } catch {}
  }, [data]);
  return null;
}
