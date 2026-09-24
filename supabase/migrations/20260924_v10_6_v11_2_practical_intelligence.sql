-- Tabi Family V10.6–V11.2 practical intelligence upgrade
-- Safe to run more than once.

alter table public.expenses add column if not exists paid_by text;
alter table public.expenses add column if not exists payment_method text;
alter table public.expenses add column if not exists exchange_rate_thb numeric(12,6);
alter table public.expenses add column if not exists planned_amount numeric(12,2);

alter table public.transport_segments add column if not exists distance_km numeric(10,1);
alter table public.transport_segments add column if not exists toll_jpy numeric(12,2);
alter table public.transport_segments add column if not exists fuel_jpy numeric(12,2);
alter table public.transport_segments add column if not exists parking_jpy numeric(12,2);
alter table public.transport_segments add column if not exists rest_stop text;
alter table public.transport_segments add column if not exists winter_ready boolean not null default false;

comment on column public.expenses.exchange_rate_thb is 'Optional THB value for 1 unit of expense currency at time of payment';
comment on column public.transport_segments.winter_ready is 'User-confirmed winter driving preparation for this route';
