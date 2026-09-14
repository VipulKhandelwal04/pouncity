-- 0010's `revoke ... from public` didn't work: live-testing after applying
-- it showed anon could still reach join_passport_as_caregiver()'s body.
-- This project evidently grants EXECUTE directly to the anon role (likely
-- via an ALTER DEFAULT PRIVILEGES rule applied at function creation time),
-- not through the PUBLIC pseudo-role — revoking from PUBLIC doesn't touch
-- a direct per-role grant. Revoke from anon explicitly instead.

revoke execute on function public.join_passport_as_caregiver(text) from anon;
