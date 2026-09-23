# Tabi Family — Japan Family Trip Planner

Mobile-first family trip planner built with **Next.js + Supabase + Vercel**.

## Current version: V4 Zero-cost Planner

The project now supports:

- Supabase Auth + RLS
- Create/delete trips
- Duplicate-trip protection
- Family profiles
- Day Planner Pro
- Family Smart Pace
- Google Maps links without Maps API
- Packing checklist
- Booking Wallet
- Expense Tracker
- Mobile-first UI

## Zero-cost design

V4 does **not require Google Maps API or an AI API**.

For places and routes, the app stores place names / optional Google Maps links and opens normal Google Maps web URLs. This avoids the need to enable Google Maps Platform billing.

## Upgrade from V3.2

Read `V4_UPGRADE.md`.

Run:

`supabase/migrations/20260923_v4_zero_cost_planner.sql`

before using Packing / Booking Wallet / Maps URL fields.

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

Open `http://localhost:3000`.

## Deploy

Push to GitHub. Vercel will redeploy automatically.
