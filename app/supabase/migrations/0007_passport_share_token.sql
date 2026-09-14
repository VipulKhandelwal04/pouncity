-- Ticket 06: Handover link generation + unauthenticated view
--
-- Access model: no broad "anyone can read shared passports" RLS policy.
-- A policy like `using (share_token is not null)` would let the anon key
-- list *every* passport that has ever been shared, since RLS can only
-- check column values on the row, not "did the caller actually supply
-- this exact token". Instead, unauthenticated access goes through a
-- SECURITY DEFINER function that takes the token as an argument and does
-- an exact match server-side — it only ever returns the one row matching
-- the token you already know, never enumerable.

alter table public.passports
  add column if not exists share_token text unique;

create or replace function public.get_passport_by_share_token(p_token text)
returns public.passports
language sql
security definer
set search_path = public
stable
as $$
  select * from public.passports
  where share_token = p_token;
$$;

-- Owners already read/write their own share_token through the existing
-- owner-scoped select/update policies on passports — no new policy needed
-- for that direction. Only the anon-callable RPC needs an explicit grant,
-- since function execute privileges aren't covered by table RLS policies.
grant execute on function public.get_passport_by_share_token(text) to anon, authenticated;
