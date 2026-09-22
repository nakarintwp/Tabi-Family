# Tabi Family — Japan Family Trip Planner

Mobile-first starter for a Japan family trip planner using **Next.js 16 + Supabase + GitHub + Vercel**.

## What is included

- Mobile-first Home / Today dashboard
- Day timeline / Plan
- Map concept screen (ready for a real map provider)
- Booking Wallet + Budget
- Create Trip form
- Supabase Magic Link Auth (SSR-compatible)
- Supabase PostgreSQL schema + Row Level Security policies
- Next.js 16 `proxy.ts` session refresh
- GitHub Actions build/typecheck CI
- Vercel-ready project structure
- Demo mode: UI works even before Supabase environment variables are added

## 1. Run locally

Requirements: Node.js 22+

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

If you do not configure Supabase yet, the UI still works in demo mode.

## 2. Create Supabase project

1. Create a project at Supabase.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Connect / API**, copy:
   - Project URL
   - Publishable key
4. Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. In Supabase Auth URL configuration, add local callback / site URLs as needed, including `http://localhost:3000/auth/callback` for local development.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Tabi Family web app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/japan-family-trip-planner.git
git push -u origin main
```

The included `.github/workflows/ci.yml` runs typecheck and build on pushes/PRs.

## 4. Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your production Vercel URL or custom domain
3. Deploy.
4. Add the production callback URL to Supabase Auth redirect URLs:
   `https://YOUR_DOMAIN/auth/callback`

Vercel detects Next.js automatically; no custom build adapter is required.

## 5. Recommended next development phase

1. Load the signed-in user's actual trips on Home.
2. CRUD for family members, trip days, activities, bookings, expenses.
3. Google Maps Platform / Mapbox map and route calculations.
4. Weather integration and Rain Plan.
5. AI itinerary API with constraint validation (child/senior/walking limits).
6. Shared-trip membership/roles for family collaboration.
7. PWA offline cache for Today, bookings, addresses and emergency data.

## Database ownership model

The MVP uses `trips.owner_id` and RLS. Only the authenticated owner can access related members/days/activities/bookings/expenses. For family collaboration, add `trip_collaborators` in the next phase and expand RLS policies.

## Security notes

- Never expose a Supabase service-role key in `NEXT_PUBLIC_*` variables.
- Use the **publishable key** in the browser.
- Authorization is enforced by PostgreSQL RLS, not only by UI checks.
- Server-side identity checks should use verified Supabase claims.
