# V8.9 — Auto-linked Trip Documents

V8.9 upgrades Trip Documents from URL-only references to a private document vault tied directly to the current trip.

## What changed

- Upload a file directly from `/trips/[id]/documents`.
- The current route trip ID is used automatically. Users do not select a trip again.
- Files are stored in the private Supabase Storage bucket `trip-documents`.
- Storage object paths begin with the trip ID, so Storage RLS follows trip access.
- Owner/editor can upload and delete. Trip members with view permission can open signed file links.
- A document row is still stored in `bookings` with `booking_type = document` so existing Master Plan / Booking / activity integrations remain compatible.
- External document URLs remain supported.
- Uploaded files are limited to 15 MB and common travel-document formats.
- Deleting an uploaded document removes both the Storage object and its `bookings` row.

## Required one-time Supabase migration

Run:

`supabase/migrations/20260924_v8_9_trip_document_storage.sql`

The migration creates the private bucket and Storage RLS policies. It does not change existing trip tables.
