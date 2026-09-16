-- The owner's contact card for a diary, readable by that diary's members
-- (the caregiver view shows it so a sitter can reach the owner fast).
-- SECURITY DEFINER because a caregiver can see neither the owner's membership
-- row nor their account row under RLS; the WHERE gate re-checks membership so
-- non-members (and anonymous callers, whose auth.uid() is null) get no rows.
-- (Applied to production 2026-09-16 as `diary_owner_contact_rpc`.)
create or replace function public.diary_owner_contact(p_diary_id uuid)
returns table(name text, phone text, emergency_phone text)
language sql stable security definer
set search_path to 'public'
as $$
  select a.name, a.phone, a.emergency_phone
  from public.account a
  join public.membership ow
    on ow.account_id = a.id
   and ow.diary_id = p_diary_id
   and ow.role = 'owner'
  where exists (
    select 1 from public.membership me
    where me.diary_id = p_diary_id
      and me.account_id = auth.uid()
  );
$$;

revoke execute on function public.diary_owner_contact(uuid) from public, anon;
grant execute on function public.diary_owner_contact(uuid) to authenticated;
