# Tabi Family V4 — Zero-cost Planner Upgrade

V4 is designed to add useful trip-planning features **without requiring paid APIs**.

## What is new

- Day Planner Pro
  - move activities up/down
  - duplicate an activity
  - move an activity to another day
  - copy a whole day to another day
- Google Maps links without Google Maps API
  - save an optional Google Maps URL
  - if no URL is saved, Tabi Family creates a normal Google Maps search link from the place name
  - daily route links open directly on Google Maps
- Family Smart Pace
  - works from activity count, duration and family profile even when no map coordinates are available
- Packing List
  - starter Japan checklist
  - categories, quantity, assignee, packed/unpacked progress
- Booking Wallet
  - Flight / Hotel / Train / Ticket / Restaurant
  - confirmation code, date/time, link and notes
- Expense Tracker
  - JPY and THB entries
  - budget progress
  - delete entries

## 1. Run the V4 SQL migration

Supabase → SQL Editor → New Query

Open:

`supabase/migrations/20260923_v4_zero_cost_planner.sql`

Copy everything and Run.

This migration is safe to rerun.

## 2. Replace project files

Copy the V4 files over your existing local project.

Keep your existing:

- `.git`
- `.env.local`

## 3. Environment variables

V4 only needs Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is no longer required for V4 zero-cost mode.

## 4. Push to GitHub

```powershell
git add .
git commit -m "V4 zero cost planner"
git push
```

Vercel should deploy automatically.

## 5. Test

1. Open a trip.
2. Day Planner: add a place and optionally paste a Google Maps link.
3. Test move up/down, duplicate and move to another day.
4. Open Packing and create starter list.
5. Open Wallet and add a booking and expense.
6. Open Maps and test a Google Maps route link.
