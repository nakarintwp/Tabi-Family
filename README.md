# Tabi Family — V8.9 Auto-linked Trip Documents

> Current build: **V8.9**


Mobile-first Japan family trip planner built with Next.js App Router + Supabase. V8.8 adds the operational layer for using the plan before and during the trip: Master Plan, Booking Center, Budget, Rental Car Pro, Today Mode 2.0, rule-based conflict checks, Trip Documents and Emergency Japan. **V8.5 is intentionally not included.**


## V8.9 — Auto-linked Trip Documents

- Upload PDF/images/Word/Excel/TXT directly into a trip.
- The current trip is linked automatically; no trip selector is required.
- Private Supabase Storage bucket with trip-aware RLS.
- Signed download links for authorized trip members.
- URL-only documents remain supported.
- One-time migration required: `supabase/migrations/20260924_v8_9_trip_document_storage.sql`.

## V8.0–V8.8 highlights

- V8.0 Trip Master Plan — itinerary + transport + bookings in one day-by-day view.
- V8.1 Booking & Reservation Center — confirmation, payment status, amount, party size and contact.
- V8.2 Expense & Budget — JPY/THB totals and rental-car related expense categories.
- V8.3 Rental Car Pro — route, booking, ETC/winter/fuel/parking checklist and Google Maps shortcuts.
- V8.4 Today Mode 2.0 — command center for bookings, transport, documents, emergency and next-action controls.
- V8.5 intentionally skipped.
- V8.6 Smart Conflict Detector — zero-API rules for overlap, short buffer, overloaded days and rental-car warnings.
- V8.7 Trip Documents — reference/link vault plus local offline metadata pack.
- V8.8 Emergency Japan — 110, 119, JNTO Visitor Hotline, Royal Thai Embassy Tokyo and Japanese phrase cards.

No new database table or column is required for this release. Booking metadata is stored in the existing `bookings.details` JSON column.

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
/today                         Today Mode 2.0
/trips/[id]/master-plan         Trip Master Plan
/trips/[id]/bookings            Booking & Reservation Center
/trips/[id]/budget              Expense & Budget
/trips/[id]/rental-car          Rental Car Pro
/trips/[id]/conflicts           Smart Conflict Detector
/trips/[id]/documents           Trip Documents
/trips/[id]/emergency           Emergency Japan
```

See `V7_5_TO_V7_9_COMPLETE.md` for the release breakdown.


See `V8_0_TO_V8_8_TRIP_CONTROL_UPGRADE.md` for the V8 release breakdown.
