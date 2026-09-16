-- Ticket 08: grooming_guide on Supabase, mirroring diet_plan (ticket 07). A
-- generated (ai/templated) or hand-written (manual) guide with a recommended
-- frequency (which drives grooming reminders, ticket 10). Latest row = current.
-- Members (Owner + the pet's Caregiver) read it; only the Owner writes.

create table if not exists public.grooming_guide (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diary (id) on delete cascade,
  coat_type text not null default '',
  frequency_weeks int not null default 8,
  summary text not null default '',
  routine text[] not null default '{}',
  professional text not null default '',
  source text not null check (source in ('ai', 'templated', 'manual')),
  created_at timestamptz not null default now()
);

alter table public.grooming_guide enable row level security;

create policy "grooming_guide: member reads"
  on public.grooming_guide for select
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = grooming_guide.diary_id and m.account_id = auth.uid()
    )
  );

create policy "grooming_guide: owner inserts"
  on public.grooming_guide for insert
  with check (public.is_diary_owner(diary_id));

create policy "grooming_guide: owner updates"
  on public.grooming_guide for update
  using (public.is_diary_owner(diary_id))
  with check (public.is_diary_owner(diary_id));

create policy "grooming_guide: owner deletes"
  on public.grooming_guide for delete
  using (public.is_diary_owner(diary_id));

grant select, insert, update, delete on public.grooming_guide to authenticated, service_role;
