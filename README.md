# Tabi Family — V11.2 Practical Intelligence Suite

## V11.3 — Simplified Navigation

Primary navigation has been consolidated to **Today · Plan · Explore · Wallet · More**. Existing features remain available inside their parent hubs; no V11.3 SQL migration is required. See `V11_3_NAVIGATION_UX_CONSOLIDATION.md`.


> Current build: **V11.2**

Mobile-first Japan family trip planner built with Next.js App Router + Supabase. V10.6–V11.2 focuses on real-trip operations: actual expenses, portable backups, browser OCR, an import review inbox, rule-based schedule checks, weather-aware planning, and richer rental-car route intelligence.

## V10.6–V11.2 highlights

- **V10.6 Actual Expense & Split Cost** — payer, payment method, optional exchange rate, planned amount and THB-equivalent summaries.
- **V10.7 Backup / Restore** — versioned JSON backup and restore into a new Trip without overwriting the source.
- **V10.8 Booking OCR** — OCR JPG/PNG/WEBP vouchers in the browser with Tesseract.js (`eng+jpn`), no paid AI API.
- **V10.9 Import Inbox** — review auto-imported bookings, unlinked documents and transport segments missing booking references.
- **V11.0 Smart Trip Engine** — rule-based checks for overlaps, short buffers, dense days, incomplete bookings and long driving segments.
- **V11.1 Weather-aware Planner** — combines Open-Meteo forecast with Indoor/Outdoor activities and rain/snow alternatives.
- **V11.2 Driving Intelligence** — distance, ETC/toll, fuel, parking, rest stop and winter-readiness tracking for rental-car segments.

### Required SQL for V11.2

Run once in Supabase SQL Editor before using the new expense/driving fields:

```text
V10_6_TO_V11_2_PRACTICAL_INTELLIGENCE.sql
```

### Key new routes

```text
/trips/[id]/backup          V10.7 Backup / Restore
/trips/[id]/import-booking  V10.8 Booking OCR + Import
/trips/[id]/inbox           V10.9 Import Review Center
/trips/[id]/smart-engine    V11.0 Smart Trip Engine
/trips/[id]/weather         V11.1 Weather-aware Planner
/trips/[id]/driving         V11.2 Driving Intelligence
```

See `V10_6_TO_V11_2_COMPLETE.md` for implementation notes.

---

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
