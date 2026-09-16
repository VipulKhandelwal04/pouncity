-- Ticket 07: diet_plan on Supabase. A generated (ai/templated) or hand-written
-- (manual) plan saved to a Diary; the latest row is the current plan. Members
-- (Owner + the pet's Caregiver) read it (the caregiver view shows it); only the
-- Owner writes it.

create table if not exists public.diet_plan (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diary (id) on delete cascade,
  current_food text not null default '',
  summary text not null default '',
  portion_per_day text not null default '',
  meals text not null default '',
  tips text[] not null default '{}',
  source text not null check (source in ('ai', 'templated', 'manual')),
  created_at timestamptz not null default now()
);

alter table public.diet_plan enable row level security;

-- Any member of the diary reads the plan. The membership subquery only looks up
-- the CALLER's own row, which own-row RLS always exposes, so no recursion and no
-- SECURITY DEFINER helper is needed (same shape as the diary member-read policy).
create policy "diet_plan: member reads"
  on public.diet_plan for select
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = diet_plan.diary_id and m.account_id = auth.uid()
    )
  );

-- Only the Owner creates/replaces the plan (the caregiver view is read-only).
create policy "diet_plan: owner inserts"
  on public.diet_plan for insert
  with check (public.is_diary_owner(diary_id));

create policy "diet_plan: owner updates"
  on public.diet_plan for update
  using (public.is_diary_owner(diary_id))
  with check (public.is_diary_owner(diary_id));

create policy "diet_plan: owner deletes"
  on public.diet_plan for delete
  using (public.is_diary_owner(diary_id));

-- Explicit grants (don't rely on default-privilege inheritance — see 0006).
grant select, insert, update, delete on public.diet_plan to authenticated, service_role;
