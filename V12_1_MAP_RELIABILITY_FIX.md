# V12.1 — Map Reliability Fix

## What changed

- Replaced runtime CDN-loaded MapLibre/OpenFreeMap renderer with bundled Leaflet + OpenStreetMap raster tiles for higher reliability in Next.js/Vercel.
- No API key, Google Cloud project, billing account, or payment card required.
- Fixed the visible build badge that was still hard-coded to V11.9.
- Updated Explore label to V12.1.
- Updated PWA reset key and service-worker cache to V12.1 so old app shells are cleared once after deployment.
- Added repeated `invalidateSize()` calls and ResizeObserver handling to prevent blank/partial maps after responsive layout changes or fullscreen transitions.
- Existing multi-marker, numbered pin, fit-all, fullscreen, popup, Google Maps navigation link, and trip route overview remain available.

No SQL migration is required.
