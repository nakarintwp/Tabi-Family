# Tabi Family — Japan Family Trip Planner

Mobile-first family trip planner for Japan built with **Next.js + Supabase + Vercel**.

## V1 features

- Supabase Magic Link authentication
- Row Level Security (RLS): each account sees only its own trip data
- Create a real trip in Supabase
- Auto-create trip days from start/end dates
- Family profiles: adult / child / senior + walking level + needs
- Add itinerary activities per day
- Expense tracking in JPY and THB
- Live Home, Trips, Plan and Wallet screens
- Responsive mobile-first UI

## 1. Supabase

Create a Supabase project, then open **SQL Editor → New query** and run:

```text
supabase/schema.sql
```

The SQL is safe to run again: tables use `if not exists` and policies are recreated cleanly.

## 2. Environment variables

Supabase → **Project Settings / Connect / API Keys**. Copy:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

For local development create `.env.local` using `.env.example`.

For Vercel go to:

**Project → Settings → Environment Variables**

Add both variables to Production, Preview and Development, then redeploy.

## 3. Supabase Auth URLs

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

## 4. Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5. Deploy with GitHub + Vercel

After changing files:

```bash
git add .
git commit -m "Add live Supabase trip planning"
git push
```

Vercel will deploy automatically from `main`.

## Main routes

- `/` — live dashboard
- `/auth/login` — Magic Link login
- `/account` — current account / logout
- `/trips` — all trips
- `/trips/new` — create trip
- `/trips/[id]` — family + itinerary + expenses
- `/plan` — itinerary from the current trip
- `/wallet` — expenses / booking wallet
- `/map` — map concept (Google Maps integration is a later phase)

## Recommended next phase

1. Google Maps / Places search and route time
2. Booking CRUD and QR/document upload
3. Weather + rain-plan re-optimization
4. Family Pace score
5. AI itinerary generation constrained by family profile and real map/opening-hours data
6. Shared trips / invitations for family members
