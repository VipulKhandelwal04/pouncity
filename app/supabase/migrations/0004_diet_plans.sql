-- Ticket 03: Diet-AI plan generation
-- One active plan per passport for the pilot; regenerating replaces it.

-- Shared ownership check so it's defined once rather than copy-pasted
-- across every policy on tables scoped through passport ownership
-- (diet_plans today; grooming guides, tracking logs, etc. later).
create or replace function public.owns_passport(target_passport_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.passports
    where passports.id = target_passport_id
      and passports.owner_id = auth.uid()
  );
$$;

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  current_food text not null,
  daily_calories numeric not null check (daily_calories > 0),
  feeding_guidance text not null,
  disclaimer text not null,
  generated_at timestamptz not null default now(),
  constraint one_plan_per_passport unique (passport_id)
);

alter table public.diet_plans enable row level security;

create policy "Owners can insert a plan for their own passport"
  on public.diet_plans for insert
  with check (public.owns_passport(passport_id));

create policy "Owners can select the plan for their own passport"
  on public.diet_plans for select
  using (public.owns_passport(passport_id));

create policy "Owners can update the plan for their own passport"
  on public.diet_plans for update
  using (public.owns_passport(passport_id));
