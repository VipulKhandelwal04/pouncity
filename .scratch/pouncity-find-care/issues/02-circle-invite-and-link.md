# 02: Circle invite + create-link (the Circle becomes the handover surface)

**What to build:** The Circle becomes the one place to hand out and manage access. From the Circle the Owner creates their Diary's standing Handover link, copies it, reads out the Referral code (and uses the native Share sheet where supported), and manages the link (replace / revoke), all inline. This **retires the standalone `/diary/share` screen** and **removes the "Share with a sitter" card from the home** — the "Your Circle" card (added in 01, in the pet's care group) is the single entry for everything handover-related. Revoke moves here too using the existing seam behavior (ends access, empties the caregivers list); ticket 04 later changes what revoke *does* (retain a Past Caregiver) and adds the past-helpers list, so 04 no longer needs to move the surface.

**Blocked by:** 01.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] From the Circle, the Owner can create the Diary's Handover link when none exists, and copy it.
- [x] The Owner can copy or read out the Referral code from the Circle, and use the native Share sheet where supported.
- [x] The Owner can replace (regenerate) and revoke the link from the Circle; revoke ends access for everyone (existing behavior) and empties the caregivers list, with an inline confirm (no native `confirm()`).
- [x] The "Share with a sitter" card is gone from the home, and `/diary/share` no longer shows the invite/copy surface (it forwards to the Circle) — no duplicate entry point remains.
- [x] Link, code, replace and revoke all go through the existing diary-service handover operations (no new module).
- [x] `tsc --noEmit` passes; the home and Circle render with no regression.

## Build notes (2026-09-15)

- `app/diary/circle/page.tsx` gained an "Invite a helper" owner section: not-shared → "Create a handover link" button; shared → link field + Copy link + native Share, referral code + Copy code, and a manage block (Replace with a new link, Revoke with an inline confirm). Reuses the seam's `regenerateHandoverLink` / `revokeHandoverLink` / `handoverCode` (no new module). The empty caregivers state no longer links to `/diary/share`; the invite block below is the create path.
- `app/diary/page.tsx`: removed the "Share with a sitter" care card (and the now-unused `shareStatus` import). The care group is now Diet / Grooming / **Your Circle**.
- `app/diary/share/page.tsx`: retired to a client redirect → `/diary/circle` (kept as a forwarder so any old link/bookmark still lands right; not hard-deleted, so no `.next` route-validator churn).
- Browser-verified: home has no Share card (care group Diet/Grooming/Circle); Circle shared state shows link `…/d/<token>` + code + Copy/Share/Replace/Revoke + "People who help with Pip: Cara"; **create-link** click mints a token and flips to the shared block; **revoke** (inline confirm) nulls the token, unbinds Cara, empties the list, returns to "Create a handover link"; `/diary/share` redirects to `/diary/circle`; 360px content-box zero overflow on the fullest UI. `tsc` green.

**Next slice:** frontier is now **03 (Circle join-by-code)**. Ticket 04 (revoke retains a Past Caregiver) is unblocked by this and now depends on 02.
