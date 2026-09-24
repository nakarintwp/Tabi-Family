# V11.4 — Real Interactive Maps

## What changed

- Explore `Map overview` is now a real interactive OpenStreetMap.
- Pan and zoom directly inside the app.
- Numbered markers match the Explore legend.
- Marker popups show place name, city, and a Google Maps navigation link.
- Trip day Map is also upgraded from the coordinate-grid mockup to a real map.
- Trip day points are connected with a dashed overview line in itinerary order. The line is not a turn-by-turn driving route.
- Uses Leaflet 1.9.4 + OpenStreetMap tiles, so no Google Maps API key is required for the embedded map.
- Existing Google Maps outbound links are retained.

## Database

No SQL migration is required. Existing latitude/longitude data is reused.

## Version

- package: `0.11.4`
- `/version`: `11.4`
- PWA cache: `v11-4`
