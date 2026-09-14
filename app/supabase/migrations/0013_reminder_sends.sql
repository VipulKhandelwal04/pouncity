-- Ticket 09: records when a reminder was last sent for a passport, so the
-- sweep doesn't re-send a feeding reminder within the same day or a
-- grooming reminder before its interval has elapsed.
--
-- Only ever read/written by the service-role-backed cron route (see
-- SETUP.md for why service_role is used here, and only here) — RLS is
-- enabled with no policies, so it default-denies anon/authenticated
-- entirely; service_role bypasses RLS by design regardless.

create table if not exists public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  kind text not null check (kind in ('feeding', 'grooming')),
  sent_at timestamptz not null default now()
);

alter table public.reminder_sends enable row level security;

create index if not exists reminder_sends_passport_kind_sent_at
  on public.reminder_sends (passport_id, kind, sent_at desc);
