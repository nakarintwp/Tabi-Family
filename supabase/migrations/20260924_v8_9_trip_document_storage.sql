-- V8.9 — private Trip Documents storage
-- Files are stored under: <trip_id>/<random-id>-<safe-filename>
-- Access follows the same owner/editor/viewer rules as the trip.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-documents',
  'trip-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "trip documents read by trip members" on storage.objects;
create policy "trip documents read by trip members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-documents'
  and public.can_view_trip(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "trip documents insert by trip editors" on storage.objects;
create policy "trip documents insert by trip editors"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-documents'
  and public.can_edit_trip(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "trip documents update by trip editors" on storage.objects;
create policy "trip documents update by trip editors"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trip-documents'
  and public.can_edit_trip(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'trip-documents'
  and public.can_edit_trip(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "trip documents delete by trip editors" on storage.objects;
create policy "trip documents delete by trip editors"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-documents'
  and public.can_edit_trip(((storage.foldername(name))[1])::uuid)
);
