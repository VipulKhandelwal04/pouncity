-- Ticket 04: Diet tracking (daily confirm)
-- One entry per passport per date; confirming again the same date updates
-- the same row rather than creating a duplicate.

create table if not exists public.tracking_entries (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  entry_date date not null,
  note text,
  confirmed_at timestamptz not null default now(),
  constraint one_entry_per_passport_per_date unique (passport_id, entry_date)
);

alter table public.tracking_entries enable row level security;

create policy "Owners can insert a tracking entry for their own passport"
  on public.tracking_entries for insert
  with check (public.owns_passport(passport_id));

create policy "Owners can select tracking entries for their own passport"
  on public.tracking_entries for select
  using (public.owns_passport(passport_id));

create policy "Owners can update tracking entries for their own passport"
  on public.tracking_entries for update
  using (public.owns_passport(passport_id));
