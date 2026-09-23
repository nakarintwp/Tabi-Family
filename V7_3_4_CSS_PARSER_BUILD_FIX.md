# V7.3.4 — CSS Parser Build Fix

## What was fixed

- Removed literal `\n` sequences that had been appended into `app/globals.css`.
- Removed every unsupported modulo expression such as `var(--i) % 5` from CSS `calc()`.
- Replaced snow/rain visual variation with valid `:nth-child()` selectors.
- Kept the snow-only atmosphere and the Create Trip city + interest pickers.
- Updated PWA/service-worker cache version to `v7.3.4`.
- `/version` now reports `7.3.4`.

## Database

No new SQL migration is required if V7.3 migration has already been applied.

## Verification

The stylesheet was parsed locally with `tinycss2`: 0 top-level parse errors and 0 declaration/rule parse errors. A full `npm install` could not complete inside the sandbox before timeout, so Vercel remains the final production build verification.
