# V7.3.1 Create Trip Picker Fix

- Force `/trips/new` to render dynamically (`revalidate = 0`).
- Make destination and interest pickers explicitly visible.
- Add V7.3.1 build badge to confirm production is on the expected build.
- Bump PWA service worker cache name so installed/mobile PWA clients pick up the newest shell.
- No database migration is required beyond the existing V7.3 interests migration.
