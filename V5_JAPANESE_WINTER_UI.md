# V5 — Japanese Winter UI / 雪の旅

V5 is a visual refresh only. It does not change Supabase tables, RLS, auth, trip creation, QR sharing, or route logic.

## What's new

- Japanese winter visual language: indigo, vermilion, washi-white and ice blue.
- CSS-only animated snowfall across the app.
- Decorative winter mountain + rising sun background.
- Snowy mountain silhouette inside hero cards.
- Frosted/washi-style cards and navigation.
- Restyled login screen for a winter Japan feel.
- Improved mobile bottom navigation and seasonal header.
- `prefers-reduced-motion` support disables snowfall animation for accessibility.

## Cost

No additional API and no additional paid service. The snow and background are CSS-only.

## Database

No SQL migration is required for V5.

## Upgrade

Copy all files over the current project while preserving:

- `.git`
- `.env.local`

Then run:

```powershell
git add .
git commit -m "V5 Japanese winter UI"
git push
```

Vercel will deploy automatically.
