# 03: Circle join-by-code

**What to build:** From the Circle, any Account can enter a Referral code to join a pet's Diary as a Caregiver, via a "helping with a pet? enter their code" action. This retires the standalone `/join` page: entering a code now lives inside the Circle, and after joining the newly helped-with pet appears in the Circle's helping-with section.

**Blocked by:** 01.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] The Circle has an "enter a code to help" action that resolves a Referral code and binds a Caregiver Membership through the seam.
- [x] After joining, the newly helped-with pet appears in the Circle's helping-with section.
- [x] The standalone `/join` route is retired; any entry point that led there now leads to the Circle.
- [x] An invalid or revoked code shows a clear, calm error and binds nothing.
- [x] `tsc --noEmit` passes.

## Build notes (2026-09-15)

- `app/diary/circle/page.tsx` gained a **"Helping with someone's pet?"** section (shown for everyone): a code input + "Add pet". On submit it `resolveCode` → (guard: if the resolved diary is your OWN, a clear "that's your own pet's code" message) → `joinAsCaregiver(token)` → refreshes `caregivingDiaries()` so the newly-joined pet appears in "Pets you help with", with a success line. Invalid code → calm error, binds nothing. All through existing seam ops (no new module).
- **Guard relaxed:** the Circle no longer bounces a 0-caregiving account to `/diary` — a signed-in account can always reach the Circle, since it is now also where you enter a code (so the cold "type a code" path isn't dead-ended).
- **`/join` retired** to a client redirect → `/diary/circle` (forwarder, like `/diary/share`). Repointed the two links that led to it: the hub's "Helping with a pet? Join with a code" and the `/d/[token]` gate's "Have a code instead?" both now go to `/diary/circle`.
- Browser-verified (as Sam, owner of Pip): invalid code → "couldn't find a pet" error; own-pet code (Pip) → "that's your own pet's code"; valid code for Rex (owned by another account) → joins, membership persists, "You're now helping with Rex", Rex appears under "Pets you help with"; `/join` → `/diary/circle` redirect; 360px zero overflow. `tsc` green.

**Next slice:** frontier is now **04 (Circle revoke retains a Past Caregiver, ADR-0006)** — unblocked by 02; **06 (handover health gate)** is also unblocked by 02.
