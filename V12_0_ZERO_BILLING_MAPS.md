# V12.0 — Zero-Billing Maps

Google Maps JavaScript API was removed from the in-app map because it requires a billing-enabled Google Cloud project.

## Map provider

- MapLibre GL JS client renderer
- OpenFreeMap public map style: `https://tiles.openfreemap.org/styles/liberty`
- OpenStreetMap data
- No Google Cloud project
- No API key
- No payment card

External **Open in Google Maps** navigation links are retained because normal Google Maps URLs do not require an API key.

## Place search

Google Places autocomplete was removed. PlacePicker now uses a deliberate **Search** button through `/api/geocode` and the public OpenStreetMap Nominatim service. It intentionally does not perform autocomplete. The server route rate-limits requests, adds an identifying User-Agent/Referer, caches results, limits to Japan, and is intended for this low-volume family planner only.

## Database

No SQL migration is required.
