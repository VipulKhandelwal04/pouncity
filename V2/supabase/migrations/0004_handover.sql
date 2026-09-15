-- Ticket 04: public Handover endpoint (unauthenticated cross-device resolve).
-- Run this once in the Supabase project's SQL Editor (after 0002, 0003).

create table if not exists public.handover_token (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diary (id) on delete cascade,
  token text not null unique,
  referral_code text not null unique,
  state text not null default 'active' check (state in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- One live link per pet (ADR-0003).
create unique index if not exists handover_token_one_active_per_diary
  on public.handover_token (diary_id) where state = 'active';

alter table public.handover_token enable row level security;

-- Any member (owner today; a real Caregiver once tickets 05/06 land) can see
-- whether a link is live — the Caregiver view uses this to know access holds.
create policy "handover_token: member reads"
  on public.handover_token for select
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = handover_token.diary_id and m.account_id = auth.uid()
    )
  );

create policy "handover_token: owner writes"
  on public.handover_token for insert
  with check (
    exists (
      select 1 from public.membership m
      where m.diary_id = handover_token.diary_id and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "handover_token: owner updates"
  on public.handover_token for update
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = handover_token.diary_id and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

create table if not exists public.handover_open (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.handover_token (id) on delete cascade,
  opened_by_account_id uuid references public.account (id),
  recipient_key text not null,
  opened_at timestamptz not null default now()
);

alter table public.handover_open enable row level security;

create policy "handover_open: owner reads"
  on public.handover_open for select
  using (
    exists (
      select 1 from public.handover_token t
      join public.membership m on m.diary_id = t.diary_id and m.role = 'owner'
      where t.id = handover_open.token_id and m.account_id = auth.uid()
    )
  );

-- Deliberately no insert policy for the authenticated/anon roles: every
-- handover_open row is written by the public /api/handover route using the
-- service role, which bypasses RLS entirely (ADR-0003 — the one path that
-- skips it, since an anonymous visitor opening a link has no session at all).
