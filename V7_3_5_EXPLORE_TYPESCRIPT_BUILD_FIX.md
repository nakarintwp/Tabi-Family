# V7.3.5 — Explore TypeScript Build Fix

Fixes the production TypeScript error in `app/explore/page.tsx` where `availableCities.map((city) => ...)` inferred `city` as `any` under strict mode.

Changes:
- Explicit `string[]` typing for `tripCities` and `availableCities`.
- Explicit `city: string` callback type.
- Package version bumped to `0.7.3-5`.
- `/version` reports `7.3.5`.

No SQL migration is required.
