# Tabi Family V9.0–V9.7 Smart Travel Upgrade

This release turns Tabi Family into a travel-day operating console while keeping recurring API cost at zero.

## V9.0 Smart Trip Dashboard
- New `/trips/[id]/command-center`
- Readiness, alerts, bookings/documents, rental-car summary, next timeline items and shortcuts.

## V9.1 Unified Timeline
- New `/trips/[id]/timeline`
- Merges itinerary activities, transport segments and bookings by trip date/time.

## V9.2 Smart Notifications
- New `/trips/[id]/notifications`
- Rule-based checks for payment/reference gaps, trip documents, rental-car winter notes and family travel fields.
- Optional browser notification permission. No push-server subscription or paid notification API.

## V9.3 Offline Trip Pack
- New `/trips/[id]/offline-pack`
- Saves trip days, transport, booking/document references and emergency numbers to the device/PWA cache.
- Private source documents are not automatically copied into the offline cache.

## V9.4 Family Travel Profiles
- Adds passport expiry, seat preference, rail/ticket note, child seat, booster seat, emergency contact and document note.
- Does not add a passport-number field.
- Requires the included additive SQL migration once.

## V9.5 Route Cost Calculator
- New `/trips/[id]/route-cost`
- Compares train, bus, taxi and rental-car total cost from prices entered by the user.
- Does not pretend to provide live fares.

## V9.6 Japan Driving Assistant
- New `/trips/[id]/driving`
- Rental bookings, car transport segments, Google Maps, fuel/parking searches and device-local pre-drive checklist.

## V9.7 Place Intelligence
- Explore cards now include planning intelligence for time allowance, crowd timing, parking/driving and weather suitability.
- Opening hours/prices/reservation notes remain curated planning data and explicitly prompt users to verify current information.

## SQL
Run `V9_4_FAMILY_TRAVEL_PROFILES.sql` once in Supabase SQL Editor before using the new V9.4 fields.
