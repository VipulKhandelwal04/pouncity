-- Ticket 05 prerequisite (PR A): move caregiver Membership onto Supabase.
-- The `membership` table, its own-row policies, and the 1:1 partial unique
-- indexes already exist (0002). What's missing is cross-account visibility:
-- an Owner must see (and be able to end) the Caregiver on THEIR diary, and read
-- that Caregiver's name. The 0002 policies only ever expose a row to the account
-- named on it, so those reads return nothing today.
--
-- A membership SELECT policy that checks ownership by querying `membership`
-- itself would recurse. So ownership/relationship checks go through
-- SECURITY DEFINER helpers: their BODY runs as the definer, bypassing RLS on the
-- inner read (no recursion). `authenticated` still needs EXECUTE to CALL them
-- (RLS evaluates the policy as the querying role), so EXECUTE is granted to
-- `authenticated` and revoked from `anon`. Exposing them as RPCs is harmless:
-- each returns only whether the CALLER owns a diary / has a given caregiver —
-- i.e. facts about the caller's own relationships, nothing about anyone else.

-- ---- recursion-safe helpers ----------------------------------------------

create or replace function public.is_diary_owner(p_diary_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.membership
    where diary_id = p_diary_id
      and account_id = auth.uid()
      and role = 'owner'
  );
$$;

-- True when p_account_id is a Caregiver on some diary the caller Owns.
create or replace function public.is_my_caregiver(p_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.membership cg
    join public.membership ow
      on ow.diary_id = cg.diary_id
     and ow.role = 'owner'
     and ow.account_id = auth.uid()
    where cg.account_id = p_account_id
      and cg.role = 'caregiver'
  );
$$;

revoke all on function public.is_diary_owner(uuid) from public, anon;
revoke all on function public.is_my_caregiver(uuid) from public, anon;
grant execute on function public.is_diary_owner(uuid) to authenticated;
grant execute on function public.is_my_caregiver(uuid) to authenticated;

-- ---- owner-scoped visibility over caregivers ------------------------------

-- Owner reads every membership on a diary they own (to see who helps).
create policy "membership: owner reads diary memberships"
  on public.membership for select
  using (public.is_diary_owner(diary_id));

-- Owner ends a Caregiver's binding on their diary (revoke). Never the owner row.
create policy "membership: owner ends caregiver"
  on public.membership for delete
  using (public.is_diary_owner(diary_id) and role = 'caregiver');

-- Owner reads the Account (name) of a Caregiver on a diary they own.
create policy "account: owner reads their caregivers"
  on public.account for select
  using (public.is_my_caregiver(id));
