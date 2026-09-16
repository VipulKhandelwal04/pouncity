-- Profile page fields: optional contact numbers on the account.
-- (Applied to production 2026-09-16 as `profile_fields_and_diary_delete`.)
alter table public.account
  add column if not exists phone text,
  add column if not exists emergency_phone text;

-- Owners can delete their diary (mirrors "diary: owner updates"). Child rows
-- (feeding_entry, diet_plan, grooming_guide, handover_token/open, membership,
-- past_caregiver, rating, reminder_pref) all cascade; analytics_event de-links.
create policy "diary: owner deletes" on public.diary
  for delete using (
    exists (
      select 1 from membership m
      where m.diary_id = diary.id
        and m.account_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- Owners can delete their diary's storage objects (mirrors "owner replaces").
-- Must run BEFORE the diary row is deleted, while the membership still exists.
create policy "pet-photos: owner deletes" on storage.objects
  for delete using (
    bucket_id = 'pet-photos'
    and exists (
      select 1 from membership m
      where (m.diary_id)::text = (storage.foldername(objects.name))[1]
        and m.account_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy "rabies-certificates: owner deletes" on storage.objects
  for delete using (
    bucket_id = 'rabies-certificates'
    and exists (
      select 1 from membership m
      where (m.diary_id)::text = (storage.foldername(objects.name))[1]
        and m.account_id = auth.uid()
        and m.role = 'owner'
    )
  );
