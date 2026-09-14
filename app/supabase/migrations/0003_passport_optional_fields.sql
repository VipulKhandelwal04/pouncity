-- Ticket 02: Complete-passport nudge + optional fields
alter table public.passports
  add column if not exists quirks text,
  add column if not exists vet_name text,
  add column if not exists vet_phone text,
  add column if not exists vet_clinic text;
