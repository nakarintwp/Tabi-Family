"use client";

import { useEffect, useState } from "react";

const BUILD = "v9.7";
const RESET_KEY = `tabi-pwa-reset-${BUILD}`;

export function PwaRegister() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function boot() {
      try {
        // One-time cleanup for users who still have an old PWA shell/CSS/JS cache.
        if (!localStorage.getItem(RESET_KEY)) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => key.startsWith("tabi-family-")).map((key) => caches.delete(key)));
          }
          localStorage.setItem(RESET_KEY, "1");
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await registration.update();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    void boot();
    return () => { cancelled = true; };
  }, []);

  return ready ? <span className="pwa-ready" aria-hidden="true" data-build={BUILD} /> : null;
}
