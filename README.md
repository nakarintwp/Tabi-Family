# Tabi Family — V7.9 Smart Explore · Route · Rental Car

> Current build: **V7.9**

Mobile-first Japan family trip planner built with Next.js App Router + Supabase. This release completes the V7.5–V7.9 planning flow: Explore → Add to Day → Smart Day → Restaurant filters → Whole-trip Route, with explicit Rental car support.

## V7.5–V7.9 highlights

- Explore map overview using existing curated coordinates — no paid map API required.
- Add a place directly from Explore to any Day in the selected Trip.
- Practical place guide: nearby station, walking estimate, opening-hours note, closure note, rough budget, reservation note, best time and family note for curated Chubu places.
- Smart Day Planner: choose 3–8 places and generate an editable day plan with suggested ordering and start times.
- Restaurant filters for Thai-popular, Hida beef, Nagoya-meshi, ramen, sushi, cafe/dessert, family, station and evening/night.
- Whole-trip Route View combining train, bus, flight, taxi, walk, ferry and Rental car.
- Dedicated Rental car entry flow on Transport with booking, pickup/return and winter-driving checklist notes.
- Google Maps links remain external links; no Google Maps API key is required for these new features.

## Existing V7 capabilities retained

- Trip-scoped Explore by selected cities.
- Curated Nagoya / Takayama / Shirakawa-go data.
- Wishlist, Trip Templates and Calendar Overview.
- Trip Cover and Trip Readiness.
- Family Profile, Day Planner Pro and Today Mode.
- PWA + Offline snapshot.
- QR collaboration (Owner / Editor / Viewer).
- Packing, Booking Wallet and Expense Tracker.
- Export / Backup.
- Weather / Rain Plan with Open-Meteo.
- Snow-only decorative atmosphere.

## Database

V7.5–V7.9 adds no new database table or column. It reuses `activities`, `trip_wishlist` and `transport_segments` from the existing V7 migration.

For an existing project that already ran V7 migrations: **no new SQL is required for V7.9**.

For a project upgrading from before V7, run the existing migration:

```text
supabase/migrations/20260923_v7_discovery_planning.sql
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Local development

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub. Vercel redeploys automatically.

## Key routes

```text
/explore                       Explore + Map + Add to Day
/trips/[id]/smart-plan         Smart Day Planner
/trips/[id]/route              Whole-trip Route View
/trips/[id]/transport          Transport + Rental car
/trips/[id]/wishlist           Wishlist
/trips/[id]/calendar           Calendar Overview
/trips/[id]/destinations       Edit Trip cities
/trips/[id]/readiness          Trip Readiness
/today                         Today Mode Pro
```

See `V7_5_TO_V7_9_COMPLETE.md` for the release breakdown.
