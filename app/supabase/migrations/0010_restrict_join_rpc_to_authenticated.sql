-- Live-testing surfaced that this project grants EXECUTE on new functions
-- more broadly by default than assumed — 0008's `grant ... to authenticated`
-- was additive, not restrictive, so anon could still reach
-- join_passport_as_caregiver()'s body (confirmed: an anon call with a
-- bogus token still ran the SELECT and hit the "Invalid or expired share
-- link" branch, rather than being denied at the permission layer).
--
-- With a *valid* token, auth.uid() is NULL for a fully anonymous caller,
-- so the INSERT into passport_caregivers (user_id not null) would fail on
-- the NOT NULL constraint rather than silently creating a caregiver row —
-- but relying on that as the actual security boundary is fragile (a
-- future schema change could quietly reopen this). Revoke explicitly
-- instead, matching the original intent that only a signed-in session can
-- attempt to join.

revoke execute on function public.join_passport_as_caregiver(text) from public;
grant execute on function public.join_passport_as_caregiver(text) to authenticated;
