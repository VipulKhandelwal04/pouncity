# 05: Dual-role home — "Helping with"

**What to build:** The home (`/diary`) gains a **"Helping with"** section listing the
Account's caregiving pets, each opening its `/care/[id]` view alongside the owner's own
"Your pet." A **caregiver-only** Account (owns no pet) is **not** force-redirected to
create a diary — its home shows "Helping with" plus a gentle, skippable "Create your own
pet's diary." For the mock (single-browser, no real cross-account data), seed **1–2
clearly-labeled demo** caregiving pets so the section is real to click through; they carry
a visible "demo" marker and disappear once genuine backend data exists.

**Blocked by:** 03, 04.

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] An account that owns a pet and helps with others sees both "Your pet" and "Helping with" — verified: owner hub (Pip) + "Helping with" (seeded demos) on one screen
- [x] A caregiver-only account sees "Helping with" + a skippable "create your own diary" prompt, with no forced redirect to create — verified: Cara (owns nothing) lands on `/diary` (NOT `/create`), "Hi, Cara" + helping list + dashed create prompt, no owner feeding tap
- [x] Each "Helping with" entry opens that pet's caregiver view (`/care/[id]`) — verified click-through to `/care/demo_mochi`
- [x] Demo caregiving pets are visibly marked as demo — "Demo" chip on each seeded pet
- [x] An account with no owned pet and no caregiving pets gets a sensible first-run state — verified → `/diary/create` (owner onboarding)
- [x] Phone-width, one-handed — 0 overflow at 360px on both home modes

**What was built:**
- Seam: `Diary.demo?: boolean`; `caregivingDiaries()` (current account's caregiver diaries, real + demo); **`ensureDemoCaregiving()`** — idempotently seeds 1-2 clearly-marked demo caregiving pets (Mochi, Waffles; live tokens so `/care` resolves) ONLY when the account has no caregiver membership yet, so real joins are never shadowed and it never re-seeds.
- Hub (`/diary`): extracted the owner content into an `OwnerHubBody` sub-component so the page can render three shapes off the same route — **owned pet** → owner hub + "Helping with"; **caregiver-only** → `CaregiverOnlyIntro` + "Helping with" + skippable `CreateOwnPrompt` (no forced `/create`); **first-run** (no pet, no caregiving) → `/create`. `ensureDemoCaregiving()` runs only when an owned pet exists (populates the demo). Owner-hub regression re-verified (all sections render post-restructure).

**Note:** demos coexist with real caregiving data and "retire once the backend makes caregiving real" (they're only seeded when the account has zero caregiving, so a real join means no demos). Cleaning up the demo rows is a backend-migration concern, not this slice.

**Conscious decision (advisor-flagged edge):** a caregiver whose last link is revoked (slice 04 unbinds them) becomes zero-owned/zero-caregiving and, on next `/diary` load, is redirected to `/diary/create` (owner onboarding) — the same path as a brand-new owner. This is **within spec** ("create or wait for a link") and keeps the common fresh-owner onboarding frictionless (straight to `/create` rather than a landing page). Kept as-is. **Future polish (not this slice):** the zero/zero case could show a gentle empty state ("a pet you helped with is no longer shared — create your own, or wait for a new link") instead of the silent redirect. Deferred.
