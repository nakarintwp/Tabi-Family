-- Tabi Family V9.4 — Family Travel Profile fields
-- Safe additive migration. No passport number is stored.

alter table public.trip_members add column if not exists passport_expiry date;
alter table public.trip_members add column if not exists seat_preference text;
alter table public.trip_members add column if not exists rail_pass text;
alter table public.trip_members add column if not exists child_seat boolean not null default false;
alter table public.trip_members add column if not exists booster_seat boolean not null default false;
alter table public.trip_members add column if not exists emergency_contact text;
alter table public.trip_members add column if not exists document_note text;
