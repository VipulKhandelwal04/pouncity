# 06: Referral code + reworked Share access list

**What to build:** A stable, human-friendly **Referral code** shown beside the link on the
owner's Share page — the same standing token, in a form you can read out over a call or
chat. A "**Join a pet with a code**" entry both on the public sign-in gate and inside the
app, equivalent to opening the link. The owner's Share "Who has access" becomes the
**named Caregivers** list (the "recent opens" count is removed); revoking unbinds every
caregiver on that diary. This reworks the built Share/admin surface (ticket 08) under
ADR-0004. The code is not a per-person invite and has no separate expiry — it changes only
when the owner regenerates or revokes the link.

**Blocked by:** 02, 04.

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] The owner's Share page shows the Referral code beside the link; both encode the same token — code = `handoverCode(token)` (grouped, e.g. `h_abcd1234` → `ABCD-1234`); verified the messy code `abcd 1234` at `/join` resolves to the same pet's gate as the link
- [x] A caregiver can join by entering the code — from the public gate and from an in-app "Join a pet with a code" — new public `/join` route (code → `resolveCode` → `/d/[token]` gate); linked from the gate ("Have a code instead?") and the dual-role home ("Helping with a pet? Join with a code")
- [x] The code changes only on regenerate / revoke (no separate expiry) — verified: regenerate mints a new token, old code + old link both die; "never expires" copy
- [x] "Who has access" lists the named Caregivers; no "recent opens" count remains anywhere — reads `diaryCaregivers(diaryId)` (Account names + initial avatar); verified 2 names listed; `recentOpens` was already removed in slice 02
- [x] Revoking unbinds every caregiver on that diary and the code + link both stop working — verified: revoke → 0 caregiver memberships, list empties, back to not-shared, old link/code dead
- [x] Copy / share affordances name the action clearly (read-out code vs shareable link) — "Copy link" vs "Copy code", separate copied states

**What was built:**
- Seam: retired `HandoverState.caregivers: string[]` (the vestigial pre-account field). Added `handoverCode(token)` (display form of the token), `resolveCode(code)` (normalizes any spacing/case → the link token, or null), `diaryCaregivers(diaryId): Account[]` (named caregivers from memberships).
- Share page: added the "Or read out a code" block (sun card, `Copy code`); "Who has access" now lists named caregiver Accounts (avatar + name + "Caregiver"); reworded empty state to mention link OR code.
- New public route `/join` (code entry → forwards to the pet's gate). Extracted a shared `components/PublicHeader` (used by the gate + `/join`; the gate's inline copy removed).
- Entry points: "Have a code instead?" on the gate's signed-out view; "Helping with a pet? Join with a code" on the dual-role home.

`tsc` green; 360px no overflow on Share + `/join`.

**Verified end-to-end 2026-09-14** as part of the epic integration run (see epic README): a messy
code typed at `/join` resolved to the right gate, a fresh caregiver joined by code, and revoke
killed both the code and the link. Copy/paste and in-app resolution are solid.

**Deferred (not a bug):** the referral code is derived straight from the base36 handover token, so it
can contain read-aloud-ambiguous characters (`0`/`O`, `1`/`l`). Fine for copy/paste and for the
mock. If the "read it out over a call" use case becomes real, mint the *token* from an unambiguous
alphabet (Crockford base32) so the code is unambiguous by construction — one change at the token
generator, `handoverCode`/`resolveCode` need no change. Not worth touching before the backend phase.
