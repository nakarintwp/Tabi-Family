# V12.2 — Bundled MapLibre Build Fix

## Why V12.1 failed
Vercel reached TypeScript and stopped at `Cannot find module 'maplibre-gl'`.
The source imported the npm package but `package.json` did not install it.

## Changes
- Adds `maplibre-gl` to dependencies.
- Loads MapLibre from the installed npm package rather than unpkg/CDN.
- Imports MapLibre's official CSS from the package in the root layout.
- Keeps OpenFreeMap as the no-key/no-Google-billing basemap provider.
- Keeps Google Maps only as an outbound navigation link.
- Version bumped to 0.12.2.

## SQL
No SQL migration is required.
