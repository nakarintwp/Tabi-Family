# Tabi Family V8.0–V8.8 Trip Control Upgrade

This bundle upgrades V7.9 to V8.8. V8.5 is intentionally excluded as requested.

## V8.0 — Trip Master Plan
- One page combines itinerary, transport segments and bookings by trip day.
- New route: `/trips/[id]/master-plan`.

## V8.1 — Booking & Reservation Center
- Flight, hotel, train, bus, rental car, restaurant and ticket reservations.
- Tracks confirmation code, status, payment status, amount, party size, contact and confirmation URL using the existing `bookings.details` JSON column.
- New route: `/trips/[id]/bookings`.

## V8.2 — Expense & Budget
- Budget setting for owner, JPY/THB totals, category breakdown and expense entry.
- Adds rental car, fuel, toll, parking and insurance expense categories without a schema change.
- New route: `/trips/[id]/budget`.

## V8.3 — Rental Car Pro
- Rental-car-only route summary, operator, class, booking ref, ETC/winter/fuel/parking checklist and map shortcuts.
- Uses existing `transport_segments` rows with `mode='car'`.
- New route: `/trips/[id]/rental-car`.

## V8.4 — Today Mode 2.0
- Adds Today Command Center for booking, transport, documents, emergency and rental car.
- Adds one-tap Translate and Booking actions around the next activity.

## V8.5
- Intentionally not included.

## V8.6 — Smart Conflict Detector
- Zero-API rule engine checks overlapping activities, low transfer buffer, overloaded days, activity/transport collisions, missing rental booking reference and winter-tire reminder.
- New route: `/trips/[id]/conflicts`.

## V8.7 — Trip Documents
- Stores document links and references as `bookings` rows with `booking_type='document'`.
- Offline reference pack stores metadata locally on the device; it does not download external document bytes.
- New route: `/trips/[id]/documents`.

## V8.8 — Emergency Japan
- Police 110, Fire/Ambulance 119, JNTO Visitor Hotline and Royal Thai Embassy Tokyo contact.
- Includes Japanese emergency phrase cards and official-support links.
- New route: `/trips/[id]/emergency`.

## Database
No new SQL migration is required. V8.0–V8.8 reuses existing `bookings`, `expenses`, `activities`, `trip_days` and `transport_segments` tables.

## Deploy
```powershell
cd C:\Users\Administrator\Desktop\japan-family-trip-planner
git add .
git commit -m "V8.8 trip control suite"
git push origin main
```
