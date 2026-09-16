-- Ticket 05 (PR B): move Past Caregiver (ADR-0006) and private Rating (ADR-0005)
-- off the localStorage mock onto Supabase. Both are Owner-only history/feedback:
-- the Caregiver they describe must never see them.

-- ---- past_caregiver: a former Caregiver kept privately after revoke ---------

create table if not exists public.past_caregiver (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diary (id) on delete cascade,
  account_id uuid not null references public.account (id) on delete cascade,
  ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (diary_id, account_id)
);

alter table public.past_caregiver enable row level security;

-- Owner-only, and grants NO access to the Diary. Reuses is_diary_owner (0005).
create policy "past_caregiver: owner reads"
  on public.past_caregiver for select
  using (public.is_diary_owner(diary_id));

create policy "past_caregiver: owner inserts"
  on public.past_caregiver for insert
  with check (public.is_diary_owner(diary_id));

create policy "past_caregiver: owner updates"
  on public.past_caregiver for update
  using (public.is_diary_owner(diary_id))
  with check (public.is_diary_owner(diary_id));

create policy "past_caregiver: owner deletes"
  on public.past_caregiver for delete
  using (public.is_diary_owner(diary_id));

-- ---- rating: private Owner -> Caregiver feedback ---------------------------

create table if not exists public.rating (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references public.account (id) on delete cascade,
  caregiver_account_id uuid not null references public.account (id) on delete cascade,
  diary_id uuid not null references public.diary (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  note text,
  updated_at timestamptz not null default now(),
  unique (owner_account_id, caregiver_account_id, diary_id)
);

alter table public.rating enable row level security;

-- Owner-only by construction: rows are scoped to owner_account_id = the caller.
-- The Caregiver (caregiver_account_id) is never the owner_account_id, so they
-- can never read the Owner's rating of them (ADR-0005: never shown, never
-- aggregated). Survives revoke/re-share because it is keyed by account ids.
create policy "rating: owner reads own"
  on public.rating for select
  using (owner_account_id = auth.uid());

create policy "rating: owner inserts own"
  on public.rating for insert
  with check (owner_account_id = auth.uid());

create policy "rating: owner updates own"
  on public.rating for update
  using (owner_account_id = auth.uid())
  with check (owner_account_id = auth.uid());

create policy "rating: owner deletes own"
  on public.rating for delete
  using (owner_account_id = auth.uid());

-- ---- let an Owner read a PAST caregiver's account name ---------------------
-- 0005's "account: owner reads their caregivers" only covers CURRENT caregivers
-- (a live membership). A Past Caregiver has no membership, so the Owner needs a
-- second path to read their name for the "helped with before" list + Rating UI.

create or replace function public.is_my_past_caregiver(p_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.past_caregiver pc
    join public.membership ow
      on ow.diary_id = pc.diary_id
     and ow.role = 'owner'
     and ow.account_id = auth.uid()
    where pc.account_id = p_account_id
  );
$$;

revoke all on function public.is_my_past_caregiver(uuid) from public, anon;
grant execute on function public.is_my_past_caregiver(uuid) to authenticated;

create policy "account: owner reads their past caregivers"
  on public.account for select
  using (public.is_my_past_caregiver(id));

-- Explicit table grants (don't rely on 0006's default-privileges inheritance —
-- that exact mechanism is what silently broke 0002-0004). RLS still scopes rows.
grant select, insert, update, delete on public.past_caregiver, public.rating
  to authenticated, service_role;
