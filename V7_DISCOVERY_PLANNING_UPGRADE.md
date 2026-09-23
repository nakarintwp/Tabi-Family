# Tabi Family V7 — Discovery & Planning Experience

V7 adds the planning layer before and around the existing Day Planner. It keeps the V6.2 zero-cost approach: curated discovery data is bundled in the app, Google Maps is opened through normal web URLs, QR is generated locally, and weather remains on Open-Meteo.

## New features

1. **Explore Japan** — `/explore`
   - Curated family-friendly places for Tokyo, Nagoya, Takayama, Shirakawa-go, Kyoto, Osaka and Fuji.
   - Filter by city/category.
   - Save a place directly into a trip Wishlist.

2. **Wishlist** — `/trips/[id]/wishlist`
   - Save places before deciding the day.
   - Add a Wishlist place into any Day Planner with one action.
   - Owner/Editor can edit; Viewer can read.

3. **Trip Templates** — `/templates`
   - Nagoya Winter Family 5D
   - Tokyo Family Easy 5D
   - Tokyo/Kyoto/Osaka 7D
   - Tokyo + Fuji 4D
   - Template activities are copied into the newly created trip and remain fully editable.

4. **Calendar Overview** — `/trips/[id]/calendar`
   - Whole-trip view with each day, activities and transport segments.

5. **Transport Segments** — `/trips/[id]/transport`
   - Train / bus / flight / car / taxi / walk / ferry.
   - Operator, service name, departure/arrival, booking reference and seat.

6. **Trip Cover** — `/trips/[id]/cover`
   - Owner can choose a built-in cover palette, emoji and tagline.
   - No paid image API or external image dependency.

7. **Trip Readiness** — `/trips/[id]/readiness`
   - 0–100 score from dates, cities, family profile, planned days, flight, hotel, transport and packing.
   - Links directly to incomplete areas.

## Required database migration

For an existing V6.2 project, run this **once** in Supabase SQL Editor:

```text
supabase/migrations/20260923_v7_discovery_planning.sql
```

The migration adds:

- `trips.cover_style`
- `trips.cover_emoji`
- `trips.cover_tagline`
- `trips.template_key`
- `trip_wishlist`
- `transport_segments`
- RLS policies for shared-trip access
- activity-log triggers for Wishlist and Transport

Existing trips, activities, bookings, packing, collaborators and expenses are not removed.

## Deploy

Copy the V7 files over the existing project while keeping:

```text
.git
.env.local
```

Then run:

```powershell
git add .
git commit -m "V7 discovery and planning experience"
git push
```

Vercel will deploy automatically.

## Test checklist

1. Open `/explore` and save a place to a trip.
2. Open the trip → Wishlist → add that place to a Day.
3. Open `/templates` and create a new trip from a template.
4. Open Calendar Overview and confirm all days appear.
5. Add a Train segment and confirm it appears in Calendar.
6. Change Trip Cover as Owner.
7. Open Readiness and verify the score changes after adding bookings/packing/transport.
8. Export JSON and confirm `trip_wishlist` and `transport_segments` are included.

## Cost

V7 does not require a new paid API. It continues to use the existing Supabase/Vercel setup and bundled curated discovery content.
