# 04: Caregiver join + binding

**What to build:** From the sign-in gate, signing up / in binds a **caregiver membership** to
that diary and lands the person on its caregiver view (built in slice 03). A first-timer goes
through the existing `/sign-in` (magic link / Google, mocked); an **already-signed-in** Account
joins with **one tap** — "Help with {pet}" — no re-auth. A single Account can hold caregiver
memberships on many diaries from different owners at once. This slice owns the **binding
lifecycle**: joining creates the membership (never a duplicate), and **revoking the pet's link
unbinds every caregiver on that diary** (the view already stops resolving on a dead link — this
also removes the now-dead membership rows so the caregiver lists in slices 05/06 stay clean).

**Blocked by:** 02, 03.

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] A signed-out opener can sign up from the gate and become a bound Caregiver on that diary — inline passwordless join (email → name), account created + caregiver membership + lands on `/care/[id]`
- [x] An already-signed-in Account gets a one-tap "Help with {pet}" (no re-auth) that binds them — verified one-tap → `/care/[id]`, no new account
- [x] Joining lands the person on the joined pet's caregiver view (`/care/[id]`) — verified both paths
- [x] The same Account can be bound to several diaries from different owners at once — verified Cara caregiving on petA + petB
- [x] Re-opening a link you're already bound to just opens the pet (no duplicate binding) — verified: bound caregiver → straight to `/care`, membership count stays 1
- [x] Revoking a diary's link unbinds every caregiver on that diary; caregiver memberships on other diaries are untouched — **key check** verified two ways: (1) 2-diary seed — revoke petA removed Cara's petA caregiver, kept her petB caregiver + Ann's petA owner; (2) plural — two caregivers (Cara + Dan) on one pet, revoke removed BOTH, owner intact
- [x] Two different helpers joining the same pet become two separate Accounts (distinct identities), not one merged account — verified: two distinct-email caregiver accounts coexist on one pet (2 accounts + 2 caregiver memberships)
- [x] The **owner opening/joining their own pet's link is NOT bound as a caregiver** — verified: Ann's own email at her gate → routed to `/diary`, no caregiver membership, no new account

**What was built:**
- Seam: `joinAsCaregiver(token): Membership | null` (requires a signed-in account; null on revoked/unknown token; idempotent for an existing caregiver; **returns null for an owner — never binds them**). `revokeHandoverLink()` now also drops every caregiver membership on that diary (owner + other diaries untouched).
- Gate (`/d/[token]`) gained the join: **signed-in non-member** → one-tap "Help with {pet}" (+ "Not you?" to switch identity); **signed-out** → inline two-step passwordless sign-in (email, then name for a new account only), then bind + route. Routing after join is by resulting role (owner→`/diary`, else `/care/[id]`), so an owner who signs in with their own email lands on `/diary`.

**Deliberate deviation from "reuse `/sign-in`" (mock constraint):** the static `/sign-in` mints the owner email (`you@pouncity.app`); routing a caregiver through it would collapse them into the owner account (the slice-01/03 email-reattach trap). So the join captures the visitor's OWN email inline. The only remaining `/sign-in` reference is `AppHeader`'s sign-**out** target (correct). Real passwordless auth replaces this in the backend phase.

**⚠️ Seam note from slice 03 (must-do here):** `roleOnDiary(diaryId)` resolves a role with a
first-match `.find()` over memberships. It's unambiguous today only because no account holds
two roles on one diary. So the join must **never create a caregiver membership for the diary's
owner** (skip binding, or one-tap "open" instead of "join", when `roleOnDiary(id) === "owner"`).
Otherwise that account gets both an owner and a caregiver membership and routing (`/diary` vs
`/care/[id]`) turns on array order. Pairs with the revoke-unbind requirement above.

**⚠️ Seam note from slice 01 (must-do here):** `signIn(email)` reattaches **by email** — the
same email returns the same Account (id + name + memberships intact). Slice 01's owner screens
hardcode a single mock identity, `signIn("you@pouncity.app")`. If this join flow reuses that
same hardcoded email, **the caregiver and the owner collapse into one Account** (and a second
caregiver would too). So the mock sign-in used here MUST pass a **distinct email per person**
(e.g. capture/generate one at the gate, or seed demo caregivers with their own emails) —
otherwise the owner-vs-caregiver distinction this whole epic rests on silently disappears. This
is a designed step, not an accident to debug later.
