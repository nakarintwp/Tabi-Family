# Tabi Family V3 Upgrade

V3 adds the first automotive-style "constraint engine" equivalent for travel: the app now plans around the **family**, not only the list of places.

## 1. Run the V3 migration

Supabase → SQL Editor → New query → paste and run:

```text
supabase/migrations/20260923_v3_family_maps_pace.sql
```

It adds these Family Profile fields:

- age
- dietary_preferences
- interests
- mobility_notes
- avoid_stairs
- needs_frequent_rest
- stroller
- notes

It also keeps activity coordinates ready for map / route scoring and upgrades `create_trip_bundle()` so newly generated child/senior profiles have sensible rest/mobility defaults.

## 2. Deploy the V3 code

Copy the V3 files over the existing repository. Keep your `.git` and `.env.local`.

```powershell
git add .
git commit -m "V3 family maps and pace score"
git push
```

## 3. Google Maps (optional, recommended)

Create a browser key with Maps JavaScript API + Places API enabled.

Add to `.env.local` and Vercel:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY
```

Redeploy Vercel after adding the variable.

## 4. Test V3

1. Open a trip.
2. Open **Family** and edit each member.
3. Set a child or senior to walking 1–2/5 and enable frequent rest / avoid stairs.
4. Open Day Planner.
5. Add at least two locations from Google Places.
6. Confirm the map shows numbered markers.
7. Confirm Family Pace Score changes when you add more activities or less-friendly activities.
8. Open **Map** from the trip dashboard to view the whole trip and per-day metrics.

## Notes about Pace Score

V3 Pace Score is deliberately transparent and deterministic. It is not an AI medical or accessibility assessment. It currently uses:

- lowest walking level in the family
- approximate point-to-point distance from saved coordinates
- number of activities
- child-friendly / senior-friendly flags
- frequent-rest / avoid-stairs profile flags

Route distance is an estimate, not live railway/walking duration. Real route time from a routing provider belongs in V4.
