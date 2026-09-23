# V7.3.2 — Deploy + Snow Fix

- Adds `/version` endpoint returning `7.3.2` with `no-store`.
- Adds a small V7.3.2 badge in the header and Create Trip page.
- One-time PWA cache/service-worker reset for this build.
- Service worker no longer pins old Next.js CSS/JS.
- Snow is rendered above page surfaces with `pointer-events: none`.
- `prefers-reduced-motion` now shows static snow instead of hiding it off-screen.
- Create Trip city and interest selectors are wrapped in visible panels.
- No database migration is required beyond V7.3 already applied.
