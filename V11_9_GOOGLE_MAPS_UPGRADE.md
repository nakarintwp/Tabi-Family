# V11.9 — Google Maps Upgrade

- Replaces the Leaflet/OpenStreetMap renderer used by Explore Map and Trip Map with Google Maps JavaScript API.
- Multi-marker maps with numbered/category-colored markers and safe info windows.
- Roadmap / Terrain / Satellite map type control.
- Street View, zoom, scale, fit-all and custom fullscreen.
- Responsive ResizeObserver handling to prevent broken/partially rendered map tiles after layout changes.
- If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is absent, the app shows a clear setup state instead of a broken tile map.
- No SQL migration required.

Required Vercel env var:

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
