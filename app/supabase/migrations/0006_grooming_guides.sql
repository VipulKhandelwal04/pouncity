-- Ticket 05: Grooming guide generation
-- One active guide per passport for the pilot; regenerating replaces it.

create table if not exists public.grooming_guides (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  frequency_guidance text not null,
  home_vs_professional_guidance text not null,
  disclaimer text not null,
  reminder_interval_days integer not null check (reminder_interval_days > 0),
  generated_at timestamptz not null default now(),
  constraint one_guide_per_passport unique (passport_id)
);

alter table public.grooming_guides enable row level security;

create policy "Owners can insert a guide for their own passport"
  on public.grooming_guides for insert
  with check (public.owns_passport(passport_id));

create policy "Owners can select the guide for their own passport"
  on public.grooming_guides for select
  using (public.owns_passport(passport_id));

create policy "Owners can update the guide for their own passport"
  on public.grooming_guides for update
  using (public.owns_passport(passport_id));
