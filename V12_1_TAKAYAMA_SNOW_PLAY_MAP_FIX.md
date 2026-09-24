# V12.1 — Takayama Snow Play + Map Reliability Fix

## Explore
Adds six family-oriented winter / snow-play day-trip options around Takayama:
- Mont Deus Park Ski Resort
- Hida Hounoki Daira Ski Resort
- Hirayu Onsen Ski Area
- Shinhotaka Ropeway Snow Experience
- ARKOPIA MOUNTAIN PARK Snow Play
- Takasu Snow Park · Yukinos

All entries are tagged for winter/snow/kids as appropriate, include coordinates for Explore Map, and include practical planning notes. Seasonal schedules must be checked before travel.

## Map reliability
- MapLibre GL JS is now bundled as an npm dependency instead of loaded from unpkg CDN.
- Base map uses OpenStreetMap raster tiles directly, avoiding the OpenFreeMap style dependency that failed for some clients.
- No Google Maps API key or billing required. Google Maps remains available only as an outbound navigation link.

No SQL migration required.
