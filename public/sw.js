const CACHE = "tabi-family-v7-3-6-shell";
const SNAPSHOT_KEY = "/__tabi_offline_snapshot.json";
const SHELL = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SAVE_SNAPSHOT") return;
  const payload = JSON.stringify({ savedAt: new Date().toISOString(), data: event.data.snapshot });
  event.waitUntil(caches.open(CACHE).then((cache) => cache.put(SNAPSHOT_KEY, new Response(payload, { headers: { "content-type": "application/json" } }))));
});

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function offlineHtml() {
  const cache = await caches.open(CACHE);
  const response = await cache.match(SNAPSHOT_KEY);
  let snap = null;
  if (response) { try { snap = await response.json(); } catch {} }
  const model = snap?.data;
  const rows = (model?.activities || []).map((a) => `<div class="row"><b>${esc((a.start_time || "—").slice(0,5))}</b><div><strong>${esc(a.title)}</strong><small>${esc(a.location_name || "")}</small>${a.maps_url ? `<a href="${esc(a.maps_url)}">เปิดแผนที่ ↗</a>` : ""}</div></div>`).join("");
  return `<!doctype html><html lang="th"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#244b68"><title>Tabi Family Offline</title><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#eef5f8;color:#17324d}.wrap{max-width:520px;margin:auto;padding:20px}.brand{display:flex;gap:10px;align-items:center;font-weight:900}.mark{width:42px;height:42px;border-radius:14px;background:#244b68;color:#fff;display:grid;place-items:center}.banner{margin:18px 0;padding:12px 14px;border-radius:16px;background:#dcecf4;color:#315f7e;font-weight:800}.card{background:#fff;border:1px solid #dce6eb;border-radius:22px;padding:18px;margin:12px 0}.row{display:grid;grid-template-columns:58px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid #edf1f3}.row:last-child{border:0}.row small,.row a{display:block;margin-top:4px;font-size:12px;color:#617986}.row a{font-weight:700}.muted{color:#6d7d87}</style><body><main class="wrap"><div class="brand"><span class="mark">TF</span><span>Tabi Family</span></div><div class="banner">📴 Offline Mode${snap?.savedAt ? ` · บันทึกล่าสุด ${esc(new Date(snap.savedAt).toLocaleString("th-TH"))}` : ""}</div>${model ? `<section class="card"><div class="muted">LAST SAVED PLAN</div><h1>${esc(model.tripTitle || "Trip")}</h1><p>${esc(model.dayTitle || model.tripDate || "Today")}</p></section><section class="card"><h2>แผนที่บันทึกไว้</h2>${rows || '<p class="muted">ไม่มีกิจกรรมใน snapshot ล่าสุด</p>'}</section>` : `<section class="card"><h2>ยังไม่มี Offline snapshot</h2><p class="muted">เปิดหน้า Today ขณะออนไลน์อย่างน้อยหนึ่งครั้งก่อนเดินทาง</p></section>`}</main></body></html>`;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => response).catch(async () => new Response(await offlineHtml(), { headers: { "content-type": "text/html; charset=utf-8" } })));
    return;
  }
  // Next.js app assets are content-hashed. Always use the network so an old PWA
  // cannot pin stale CSS/JS after a deployment. Icons may still be cached.
  if (["style", "script", "font"].includes(request.destination)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  if (request.destination === "image") {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    })));
  }
});
