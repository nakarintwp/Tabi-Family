# Tabi Family V10.0–V10.5 — Smart Automation Suite

## V10.0 — Auto Import Booking
- New `/trips/[id]/import-booking` wizard.
- Reads TXT/CSV/JSON directly in the browser and attempts a local text-layer extraction for PDFs.
- Infers booking type, title/provider, booking/reference code, first date/time, amount/currency and basic origin/destination hints.
- Every inferred field is editable and must be confirmed by the user before saving.
- No paid AI/OCR API is called.

> Image files are accepted as source documents, but automatic OCR is intentionally not bundled in V10.0. For image-only vouchers, paste copied text into the wizard for better parsing.

## V10.1 — Smart Document → Trip Linking
- Imported bookings are stored in the existing `bookings` table.
- Existing trip documents can be suggested by category/reference.
- A newly uploaded source file is saved to the existing private `trip-documents` bucket and linked to the created booking.
- Travel bookings can link to an existing `transport_segments` row or create a new segment from confirmed origin/destination data.
- Linking metadata is stored in existing `bookings.details` JSON.

## V10.2 — Smart Route Optimizer
- New `/trips/[id]/optimize` route.
- Uses saved activity coordinates and a nearest-neighbor heuristic to reduce obvious backtracking.
- Shows current vs suggested straight-line route distance.
- Applies only the ordering when the user confirms; it does not silently rewrite the itinerary.
- Distances are straight-line estimates, not road travel time.

## V10.3 — Map-first Trip View
- Upgraded `/trips/[id]/map` into a day-focused map board.
- Day chips switch between trip days.
- Shows coordinate pins, activity order, same-day transport, and same-day bookings.
- Uses the saved coordinates and external Google Maps search links; no new map billing/API is required for the board.

## V10.4 — Live Trip Status
- Today Mode now includes a Japan-time live status card.
- Detects an in-progress activity or transport window and surfaces the next activity/navigation shortcut.
- Today date matching now explicitly uses `Asia/Tokyo`.

## V10.5 — Delay Replanner
- Local preview buttons for +15 / +30 / +60 minutes.
- Shows the shifted remaining schedule and warns when the preview approaches fixed booking/transport times or late evening.
- Owner/Editor can explicitly apply the delay to remaining planned activities.
- Booking and Transport times are treated as fixed anchors and are not shifted automatically.

## Database / SQL
No new SQL is required for V10.0–V10.5.

This release reuses:
- `bookings` and `bookings.details`
- `transport_segments`
- `trip_days` / `activities`
- the private `trip-documents` Storage bucket introduced in V8.9

If the V8.9 document-storage migration has not been run yet, run it before using source-file upload in Booking Import.
