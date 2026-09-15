# Epic: Accounts & multi-owner caregiving

Introduces the missing identity spine and turns single-owner sharing into a real
dual-role model, per the design session on 2026-09-14.

**Model of record:** `CONTEXT.md` (App section — Account, Membership, Owner, Caregiver,
Access, Handover link, Referral code; Viewer retired) and **ADR-0004** (access requires
an account, supersedes the anonymous-viewer part of ADR-0003).

**The shape in one line:** a person is an **Account**; **Owner** and **Caregiver** are
per-diary roles held via a **Membership**; one Account can own its pet *and* help with
others' at once (caregiver-only accounts own nothing); reading a diary requires an
account — signed-out openers hit a sign-in gate.

**Reworks** these `pouncity-app` tickets under the new model: **07** (handover view →
sign-in gate), **08** (share surface → named Caregivers + referral code), **09**
(caregiver sign-up + interact). Do **not** build the old 07/09 as written.

**Pilot constraints:** one owned pet per account (infra multi-ready); the mock is
single-browser, so "Helping with" is seeded with clearly-labeled demo pets until the
backend makes cross-account data real. Everything is UI-first behind the `diary-service`
seam; no real auth/DB yet.

## Slices (dependency order)

1. **01 — Account identity, name capture & attribution** — the foundation. **DONE.** _Blocked by: none._
2. **02 — Access requires an account: the handover gate** (reworks 07). **DONE.** _Blocked by: 01._
3. **03 — Caregiver pet view (`/care/[id]`).** **DONE.** Carries the diary-id-addressed seam prefactor. _Blocked by: 02._
4. **04 — Caregiver join + binding.** **DONE.** Owns the binding lifecycle (join + revoke-unbinds); lands on the 03 view. _Blocked by: 02, 03._
5. **05 — Dual-role home: "Helping with".** **DONE.** _Blocked by: 03, 04._
6. **06 — Referral code + reworked Share access list** (reworks 08). **DONE.** _Blocked by: 02, 04._

**✅ Epic complete — all 6 slices built + browser-verified 2026-09-14 (local/uncommitted).** The
owner app now has real accounts, per-diary owner/caregiver roles, an account-gated handover, a
caregiver view, a dual-role home, and referral-code sharing — all behind the `diary-service` seam,
UI-first, ready for the backend phase (Supabase auth/db + AI Gateway) to swap in behind the same
boundary.

**Integration-proven end-to-end 2026-09-14** (beyond the per-slice checks, which used hand-seeded
storage): one continuous run through the *real UI flows* chained every slice's writes into the next
slice's reads — owner created via the create form (Olivia + Biscuit) → real Share UI minted the
link + code → signed out → a messy code (`y0t0 h8wt 3r`) typed at `/join` resolved to the correct
gate (confirms `resolveCode` normalization *and* that a freshly-minted code resolves) → the real
join flow (email → name "Cara") minted a **distinct** account and bound Cara as caregiver → Cara
logged the feed (attributed "by Cara") → back as the owner, "Who has access" listed **Cara by the
name she typed** and the hub showed "Fed today · by Cara" (the previously-untested join→named-list
+ join→feed handoff, now proven on real data, not synthetic memberships) → revoke unbound Cara,
nulled the token, emptied the list, returned to not-shared, and Cara's `/care` view went to
"Access ended". No behaviour changed; this was verification only.

**Ordering note (2026-09-14):** the caregiver **view (03)** now precedes the **join (04)** —
swapped from the original 03=join / 04=view. A join can't be demoed without a screen to land
on, and the view is verifiable on its own against a seeded caregiver membership; "revoke
unbinds" folds into the join slice (the view already stops resolving on a dead link). See
`docs/spec-owner-app-accounts-caregiving.md` for the full synthesis.
