"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);
  return ready ? <span className="pwa-ready" aria-hidden="true" /> : null;
}
