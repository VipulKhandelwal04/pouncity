-- Ticket 03: feeding confirms and history, cross-device.
-- Run this once in the Supabase project's SQL Editor (after 0002).

create table if not exists public.feeding_entry (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diary (id) on delete cascade,
  fed_on date not null,
  by_account_id uuid not null references public.account (id),
  by_name text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (diary_id, fed_on)
);

alter table public.feeding_entry enable row level security;

create policy "feeding_entry: member reads"
  on public.feeding_entry for select
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = feeding_entry.diary_id and m.account_id = auth.uid()
    )
  );

create policy "feeding_entry: member writes"
  on public.feeding_entry for insert
  with check (
    exists (
      select 1 from public.membership m
      where m.diary_id = feeding_entry.diary_id and m.account_id = auth.uid()
    )
  );

create policy "feeding_entry: member updates own"
  on public.feeding_entry for update
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = feeding_entry.diary_id and m.account_id = auth.uid()
    )
  );

create policy "feeding_entry: member deletes"
  on public.feeding_entry for delete
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = feeding_entry.diary_id and m.account_id = auth.uid()
    )
  );
