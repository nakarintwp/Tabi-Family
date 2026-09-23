# V4.3.2 — Trip Create RLS Fix

This patch fixes `new row violates row-level security policy for table "trips"`
when creating a trip after V4.3/V4.3.1.

## Upgrade

1. Supabase → SQL Editor → New query.
2. Run the entire file:
   `supabase/migrations/20260923_v4_3_2_trip_create_rls_fix.sql`
3. No data reset is required.
4. No user deletion is required.
5. No Vercel environment-variable change is required.
6. Deploy the V4.3.2 project files (or simply run the SQL patch first; the app-side create call is API-compatible).

## Security model

The RPC is `SECURITY DEFINER`, but the caller cannot submit an owner ID. The function
sets `owner_id` from `auth.uid()` and execute permission is granted only to the
`authenticated` role. RLS remains enabled for normal table access.
