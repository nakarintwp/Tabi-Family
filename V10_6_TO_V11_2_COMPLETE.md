# Tabi Family V10.6–V11.2

## V10.6 Actual Expense & Split Cost
- Expense records now support payer, payment method, optional exchange rate to THB, and planned amount.
- Budget page summarizes payer totals and THB-equivalent values when a rate is supplied.

## V10.7 Backup / Restore
- Download a versioned JSON backup of trip structure.
- Restore into a new trip without overwriting the source.
- Private document binaries are intentionally not embedded; document count/index remains visible.

## V10.8 Booking OCR
- JPG/PNG/WEBP vouchers can be OCR'd in the browser with Tesseract.js (eng+jpn), then pass through the existing local booking parser.
- No paid AI API is required. OCR language assets may require internet on first use.

## V10.9 Import Inbox
- Review auto-imported bookings, unlinked documents, and transport segments without booking references.

## V11.0 Smart Trip Engine
- Rule-based checks for overlapping activities, short buffers, dense days, missing booking references, and long driving routes.

## V11.1 Weather-aware Planner
- Open-Meteo forecast combined with the trip's Indoor/Outdoor activities to produce day-specific planning hints.

## V11.2 Driving Route Intelligence
- Car segments support distance, toll, fuel, parking, rest stop, and winter-readiness fields.
- Driving dashboard summarizes distance and road costs and flags long routes / unchecked winter preparation.

## Migration
Run `V10_6_TO_V11_2_PRACTICAL_INTELLIGENCE.sql` once in Supabase SQL Editor before deploying these features.
