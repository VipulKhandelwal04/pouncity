-- Ticket 08: Caregiver sign-up to interact
--
-- Joining is a SECURITY DEFINER RPC, same reasoning as Ticket 06's read
-- path: it uses auth.uid() internally rather than trusting a
-- client-supplied user id, and only ever creates a membership row for a
-- passport whose share_token currently matches the given token —
-- never enumerable, never bypassable by guessing a passport id.

create table if not exists public.passport_caregivers (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  wants_reminders boolean not null default true,
  joined_at timestamptz not null default now(),
  constraint one_membership_per_passport_per_user unique (passport_id, user_id)
);

alter table public.passport_caregivers enable row level security;

-- A caregiver can see their own membership row; an owner can see who has
-- joined their own passport.
create policy "Caregivers see their own membership; owners see their passport's"
  on public.passport_caregivers for select
  using (auth.uid() = user_id or public.owns_passport(passport_id));

-- A caregiver can update their own reminder preference. RLS alone can't
-- stop them setting passport_id/user_id to something else on that same
-- row (USING checks the old row, WITH CHECK checks the new row, but
-- neither can compare old vs new to forbid *changing* a column) — so the
-- actual guard is the column-level grant below, which permits UPDATE on
-- wants_reminders only. Without it, a caregiver could rewrite their own
-- row's passport_id to a passport they were never given a token for and
-- immediately gain read access via the select policy further down.
create policy "Caregivers can update their own membership"
  on public.passport_caregivers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke update on public.passport_caregivers from authenticated;
grant update (wants_reminders) on public.passport_caregivers to authenticated;

-- No direct insert policy — membership is only ever created through the
-- join_passport_as_caregiver() function below, which enforces token
-- validity server-side.

-- Shared caregiver check, symmetric with owns_passport() — used here and
-- by the tracking_entries caregiver policies added in the next migration.
create or replace function public.is_caregiver_of_passport(target_passport_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.passport_caregivers
    where passport_caregivers.passport_id = target_passport_id
      and passport_caregivers.user_id = auth.uid()
  );
$$;

create or replace function public.join_passport_as_caregiver(p_token text)
returns public.passports
language plpgsql
security definer
set search_path = public
as $$
declare
  matched public.passports;
begin
  select * into matched from public.passports where share_token = p_token;

  if matched.id is null then
    raise exception 'Invalid or expired share link';
  end if;

  insert into public.passport_caregivers (passport_id, user_id)
  values (matched.id, auth.uid())
  on conflict (passport_id, user_id) do nothing;

  return matched;
end;
$$;

grant execute on function public.join_passport_as_caregiver(text) to authenticated;

-- A caregiver can read the one passport they're attached to, alongside
-- the existing owner-only select policy on passports (policies for the
-- same command are OR'd together, so this doesn't weaken the original).
create policy "Caregivers can select their assigned passport"
  on public.passports for select
  using (public.is_caregiver_of_passport(id));
