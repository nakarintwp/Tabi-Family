# Tabi Family V2 Upgrade

V2 focuses on perceived speed and the core trip-planning workflow.

## What changed

- Fast Create Trip RPC: creates Trip + Members + Days in one PostgreSQL transaction / one request.
- Create button has a pending state and prevents repeated taps.
- Trip Dashboard now loads trip/member/day/activity/expense data with one nested Supabase query.
- Dedicated mobile Day Planner for each day.
- Activity CRUD: create, read, edit and delete.
- Activity fields: time, type, location, duration, notes, child-friendly and senior-friendly.
- Day title and day notes editing.
- Loading skeletons while dynamic trip pages load.

## Required database upgrade (existing V1 database)

In Supabase -> SQL Editor -> New query, run:

`supabase/migrations/20260923_performance_day_planner.sql`

You only need to run this migration once.

If you create a completely new Supabase database, running the full `supabase/schema.sql` already includes the V2 function.

## Deploy

Replace the project files but keep your existing `.git` and `.env.local`.

```powershell
cd C:\Users\Administrator\Desktop\japan-family-trip-planner

git add .
git commit -m "V2 performance dashboard and day planner"
git push
```

Vercel should deploy automatically from `main`.

## Test checklist

1. Login.
2. Create a new 5-10 day trip.
3. Confirm creation redirects to Trip Dashboard quickly.
4. Open Day 1.
5. Add an attraction.
6. Edit the attraction.
7. Delete the attraction.
8. Change the day title / notes.
9. Return to Dashboard and confirm activity counts update.
