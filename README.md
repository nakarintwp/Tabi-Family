# Tabi Family — V7 Discovery & Planning Experience

Mobile-first Japan family trip planner built with **Next.js + Supabase + Vercel**.

## V7 highlights

- Explore Japan with curated family-friendly places
- Wishlist → save now, schedule later
- Ready-made Trip Templates
- Calendar Overview
- Transport Segments for train/bus/flight/car/etc.
- Trip Cover presets
- Trip Readiness score (0–100)
- Family Profile + Day Planner Pro
- Today Mode + current-location route
- PWA + Offline snapshot
- QR collaboration (Owner / Editor / Viewer)
- Packing, Booking Wallet and Expense Tracker
- Export / Backup
- Weather / Rain Plan with Open-Meteo
- Live weather atmosphere

## Upgrade from V6.2

Run this migration once:

```text
supabase/migrations/20260923_v7_discovery_planning.sql
```

Then deploy the source to Vercel. Full instructions are in `V7_DISCOVERY_PLANNING_UPGRADE.md`.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

No Google Maps API key, AI API key, QR API, or paid weather API is required for V7.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Push to GitHub. Vercel redeploys automatically.

## Fresh Supabase project

Run `supabase/schema.sql`. For an existing project, apply migrations in sequence through V6 and then V7.

## Key routes

```text
/explore                       Explore Japan
/templates                     Trip Templates
/trips/[id]/wishlist           Wishlist
/trips/[id]/calendar           Calendar Overview
/trips/[id]/transport          Transport Segments
/trips/[id]/cover              Trip Cover
/trips/[id]/readiness          Trip Readiness
/today                         Today Mode Pro
```

## V7.1 — Snow Only Theme

พื้นหลังของแอปเปลี่ยนเป็นหิมะตกตลอดเวลา โดยไม่เปลี่ยนตามสภาพอากาศจริง ส่วนหน้า Weather / Rain Plan ยังทำงานตามเดิม ดูรายละเอียดใน `V7_1_SNOW_ONLY_THEME.md`.
