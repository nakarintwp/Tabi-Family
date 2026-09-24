const CACHE = "tabi-family-v11-2-shell";
const SNAPSHOT_KEY = "/__tabi_offline_snapshot.json";
const TRIP_PACK_KEY = "/__tabi_trip_pack.json";
const SHELL = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SAVE_SNAPSHOT") {
    const payload = JSON.stringify({ savedAt: new Date().toISOString(), data: event.data.snapshot });
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(SNAPSHOT_KEY, new Response(payload, { headers: { "content-type": "application/json" } }))));
  }
  if (event.data?.type === "SAVE_TRIP_PACK") {
    const payload = JSON.stringify({ savedAt: new Date().toISOString(), tripId: event.data.tripId, data: event.data.snapshot });
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(TRIP_PACK_KEY, new Response(payload, { headers: { "content-type": "application/json" } }))));
  }
});

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function offlineHtml() {
  const cache = await caches.open(CACHE);
  const [response, packResponse] = await Promise.all([cache.match(SNAPSHOT_KEY), cache.match(TRIP_PACK_KEY)]);
  let snap = null; let pack = null;
  if (response) { try { snap = await response.json(); } catch {} }
  if (packResponse) { try { pack = await packResponse.json(); } catch {} }
  const model = snap?.data;
  const packModel = pack?.data;
  const rows = (model?.activities || []).map((a) => `<div class="row"><b>${esc((a.start_time || "—").slice(0,5))}</b><div><strong>${esc(a.title)}</strong><small>${esc(a.location_name || "")}</small>${a.maps_url ? `<a href="${esc(a.maps_url)}">เปิดแผนที่ ↗</a>` : ""}</div></div>`).join("");
  const packRows = (packModel?.days || []).slice(0,12).map((d) => `<div class="row"><b>${esc((d.trip_date || "").slice(5))}</b><div><strong>${esc(d.title || d.trip_date || "Day")}</strong><small>${esc((d.activities || []).length)} activities</small></div></div>`).join("");
  return `<!doctype html><html lang="th"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#244b68"><title>Tabi Family Offline</title><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#eef5f8;color:#17324d}.wrap{max-width:520px;margin:auto;padding:20px}.brand{display:flex;gap:10px;align-items:center;font-weight:900}.mark{width:42px;height:42px;border-radius:14px;background:#244b68;color:#fff;display:grid;place-items:center}.banner{margin:18px 0;padding:12px 14px;border-radius:16px;background:#dcecf4;color:#315f7e;font-weight:800}.card{background:#fff;border:1px solid #dce6eb;border-radius:22px;padding:18px;margin:12px 0}.row{display:grid;grid-template-columns:58px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid #edf1f3}.row:last-child{border:0}.row small,.row a{display:block;margin-top:4px;font-size:12px;color:#617986}.row a{font-weight:700}.muted{color:#6d7d87}.pill{display:inline-block;padding:5px 8px;border-radius:999px;background:#eef6fa;margin:3px;font-size:12px}</style><body><main class="wrap"><div class="brand"><span class="mark">TF</span><span>Tabi Family · V11.2</span></div><div class="banner">📴 Offline Mode</div>${model ? `<section class="card"><div class="muted">TODAY SNAPSHOT</div><h1>${esc(model.tripTitle || "Trip")}</h1><p>${esc(model.dayTitle || model.tripDate || "Today")}</p>${rows || '<p class="muted">ไม่มีกิจกรรม</p>'}</section>` : ""}${packModel ? `<section class="card"><div class="muted">OFFLINE TRIP PACK</div><h2>${esc(packModel.tripTitle || packModel.trip?.title || "Trip")}</h2><p>${esc((packModel.trip?.cities || []).join(" → "))}</p>${packRows}<div><span class="pill">🎫 ${(packModel.bookings || []).length} bookings</span><span class="pill">🚆 ${(packModel.transports || []).length} transport</span><span class="pill">📂 ${(packModel.documents || []).length} docs</span></div><p><b>Emergency:</b> Police 110 · Fire/Ambulance 119</p></section>` : ""}${!model && !packModel ? `<section class="card"><h2>ยังไม่มี Offline data</h2><p class="muted">เปิด Today หรือ Offline Trip Pack ขณะออนไลน์ แล้วกดบันทึกก่อนเดินทาง</p></section>` : ""}</main></body></html>`;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => new Response(await offlineHtml(), { headers: { "content-type": "text/html; charset=utf-8" } })));
    return;
  }
  if (["style", "script", "font"].includes(request.destination)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  if (request.destination === "image") {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; })));
  }
});
