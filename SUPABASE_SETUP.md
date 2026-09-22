# Supabase setup checklist

Use this after deploying Tabi Family to Vercel.

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Copy Project URL and Publishable Key.
4. Add both values to Vercel Environment Variables.
5. Redeploy Vercel.
6. In Supabase Auth URL Configuration set:
   - Site URL: `https://tabi-family.vercel.app`
   - Redirect URL: `https://tabi-family.vercel.app/**`
   - Redirect URL: `http://localhost:3000/**`
7. Open `/auth/login` and request a Magic Link.
8. Create the first trip at `/trips/new`.
9. Confirm rows appear in Supabase Table Editor under `trips`, `trip_days`, and `trip_members`.
10. Add one activity and one expense to verify RLS-backed writes.
