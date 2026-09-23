# Tabi Family V3.2 — Duplicate Guard

## What this fixes

Older builds could leave several identical trips if the create request was submitted/retried more than once while the user was waiting.

V3.2 adds database-level idempotency. The same create-form request can create only one trip.

It also adds a **ลบ Trip ที่ซ้ำ** button on `/trips`. It keeps the oldest trip in each exact duplicate group and deletes the rest. Related days, activities, family members, bookings and expenses are removed through existing cascade foreign keys.

## Upgrade

1. Supabase → SQL Editor → New query.
2. Run `supabase/migrations/20260923_v3_2_duplicate_guard.sql` once.
3. Copy this V3.2 project over your current local project. Keep `.git` and `.env.local`.
4. Commit and push:

```powershell
git add .
git commit -m "V3.2 prevent duplicate trips"
git push
```

5. After Vercel deploys, open `/trips`.
6. If duplicate trips are detected, press **ลบ Trip ที่ซ้ำ** once.

## Safety

The cleanup RPC uses `auth.uid()` and only deletes rows owned by the current signed-in user. A duplicate group must match title, start date, end date, cities, pace, budget and currency exactly.
