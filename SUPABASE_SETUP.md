# Supabase setup checklist — Tabi Family V3

1. Create a Supabase project.
2. Fresh install: run `supabase/schema.sql` in SQL Editor.
3. Existing V2 install: run `supabase/migrations/20260923_v3_family_maps_pace.sql` once.
4. Add Supabase Project URL + Publishable Key to Vercel.
5. Redeploy.
6. Set Supabase Auth Site URL to `https://tabi-family.vercel.app`.
7. Add redirect URLs `https://tabi-family.vercel.app/**` and `http://localhost:3000/**`.
8. Login using `/auth/login`.
9. Open a trip → Family and save a detailed member profile.
10. Open Day Planner and verify activity writes.
11. Optional: configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for Places + Maps.
12. Verify coordinates appear on activities and `/trips/[id]/map` shows markers.
