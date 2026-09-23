# V7.3.3 — CSS Build Fix

Fixes the V7.3.2 Vercel build failure in `app/globals.css`.

## Fixed
- Removed literal `\\n` escape text accidentally appended into `globals.css`.
- Replaced invalid CSS modulo expression `var(--i) % 5` with valid CSS.
- Kept snow visible above cards with `pointer-events:none`.
- Kept static snow visible for `prefers-reduced-motion`.
- Version endpoint now reports `7.3.3`.

## SQL
No database migration is required.
