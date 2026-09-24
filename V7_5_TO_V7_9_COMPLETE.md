# Tabi Family V7.5–V7.9 Complete Upgrade

## V7.5 — Explore Map + Add to Day
- Explore includes a zero-cost coordinate map overview.
- Place cards can add directly to a selected Trip Day.
- Wishlist remains available as a secondary save flow.

## V7.6 — Practical Place Guide
- Curated guide fields for selected Chubu attractions/restaurants: nearest station, walking estimate, opening-hours note, closure note, rough budget, reservation note, best time and family note.
- Time/budget details are planning hints and should be rechecked before travel.

## V7.7 — Smart Day Planner
- New `/trips/[id]/smart-plan` page.
- Select a city, day and 3–8 places.
- Generates an editable Day Planner with suggested ordering and start times.
- No paid AI or route API is used.

## V7.8 — Restaurant Filters
- Food filters: Thai-popular, Hida beef, Nagoya-meshi, ramen, sushi, cafe, family and near-station.
- Uses curated static tags; no Places API cost.

## V7.9 — Trip Route + Rental Car
- New `/trips/[id]/route` whole-trip route view.
- Combines train, bus, flight, taxi, walking, ferry and rental car segments.
- Rental car is stored using the existing `transport_segments.mode = 'car'` support, so no new SQL migration is required.
- Transport page now has a dedicated Rental car form and checklist.

## Database
No new SQL migration is required for V7.5–V7.9 when the existing V7 discovery migration has already been applied.
