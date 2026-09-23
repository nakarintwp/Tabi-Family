# V7.2.1 — Delete Trip Fix

Fixes the generic server error shown after pressing **ลบทริปนี้**.

## Root cause
V6/V7 added activity-feed audit triggers. When a trip was deleted, PostgreSQL cascaded deletes to child rows. The child `AFTER DELETE` triggers then attempted to insert a new `trip_activity_log` row that referenced the trip currently being deleted.

## Fix
- `log_trip_change()` now writes audit rows only while the parent trip still exists.
- Foreign-key race during cascade deletion is defensively ignored inside the audit function.
- Delete action now returns a readable error on the trip page instead of throwing the generic Next.js server-error screen.

## Required
Run:

`supabase/migrations/20260923_v7_2_1_delete_trip_fix.sql`

No data is deleted by the migration itself.
