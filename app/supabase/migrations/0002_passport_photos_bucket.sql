-- Storage bucket for passport photos, uploaded client-side during passport creation.
-- Capped at 5 MB and restricted to common image types so the public bucket
-- can't be used to host arbitrary large files or non-image content.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'passport-photos',
  'passport-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can upload their own passport photo"
  on storage.objects for insert
  with check (
    bucket_id = 'passport-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Passport photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'passport-photos');
