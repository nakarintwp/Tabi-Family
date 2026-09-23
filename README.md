# Tabi Family — Japan Family Trip Planner

Mobile-first family trip planner for Japan built with **Next.js 16 + Supabase + Vercel**.

## V3 highlights

- Full **Family Profile** per traveler: age, walking level, dietary needs, interests, mobility notes, stairs/rest/stroller flags
- **Family Pace Score** on each day using family walking level, activity count, child/senior suitability, and mapped-point distance
- **Google Places autocomplete** for Japan locations in Day Planner
- Saves latitude / longitude for activities
- **In-app Google Map** for each day and the whole trip
- Google Maps route deep-link when at least two mapped points exist
- Trip Map shows mapped-point coverage and Pace Score by day
- V2 performance improvements remain: one-request trip creation, loading states, fast nested dashboard query
- Supabase Magic Link Auth + RLS
- Expense tracking in JPY / THB

## Upgrade an existing V2 project

Run this file once in **Supabase → SQL Editor**:

```text
supabase/migrations/20260923_v3_family_maps_pace.sql
```

Then deploy the V3 code. Existing trips remain in place.

See `V3_UPGRADE.md` for the full checklist.

## Fresh Supabase project

For a new project, run:

```text
supabase/schema.sql
```

## Environment variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Optional but strongly recommended for V3 maps / place search:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_BROWSER_KEY
```

Without the Google key, trip planning, Family Profile, Supabase, and Pace Score still work. The UI displays a map fallback and location names can still be typed manually.

For local development copy `.env.example` to `.env.local`.

For Vercel add the variables at **Project → Settings → Environment Variables**, then redeploy.

## Google Maps setup

In Google Cloud:

1. Create/select a project and enable billing for Maps Platform.
2. Enable **Maps JavaScript API** and **Places API**.
3. Create a browser API key.
4. Restrict the key to your web origins, for example:
   - `https://tabi-family.vercel.app/*`
   - `http://localhost:3000/*`
5. Restrict API usage to the Maps JavaScript and Places APIs.
6. Add the key to Vercel as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and redeploy.

## Supabase Auth URLs

Supabase → **Authentication → URL Configuration**

Site URL:

```text
https://tabi-family.vercel.app
```

Redirect URLs:

```text
https://tabi-family.vercel.app/**
http://localhost:3000/**
```

## Main routes

- `/` — current-trip dashboard
- `/auth/login` — Magic Link login
- `/account` — account / logout
- `/trips` — all trips
- `/trips/new` — create trip
- `/trips/[id]` — trip dashboard
- `/trips/[id]/family` — V3 full Family Profile
- `/trips/[id]/days/[dayId]` — V3 Day Planner + Pace Score + map
- `/trips/[id]/map` — full-trip map and daily route metrics
- `/plan` — itinerary overview
- `/map` — redirects to current trip map
- `/wallet` — expenses / booking wallet

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

```bash
git add .
git commit -m "V3 family maps and pace score"
git push
```

Vercel deploys automatically from `main`.

## V4 direction

Recommended next phase: **AI itinerary builder + real travel-time constraints + weather/rain plan + booking wallet/document upload + family sharing**.
