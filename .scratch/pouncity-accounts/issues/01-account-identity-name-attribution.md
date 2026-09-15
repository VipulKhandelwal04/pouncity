# 01: Account identity, name capture & attribution

**What to build:** A person using the app now has an **Account** (id, display name, email).
At first sign-in the app asks once — "what should we call you?" — and remembers it. The
`diary-service` seam moves from a single stored diary to **accounts + diaries-keyed-by-id
+ memberships** (each membership carries a role: `owner` | `caregiver`); the current
owner's diary becomes that Account's **owner membership**, so every existing owner screen
keeps working unchanged. Feeding confirms attribute to the Account's **name** instead of
the email prefix. A minimal account menu in the header shows name, email and sign out.

This slice is the identity foundation only — no caregiving or multi-diary UI yet.

**Blocked by:** None (can start immediately).

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] First sign-in captures a display name; a returning sign-in does not ask again — `/diary/welcome`, guarded by an empty `account.name`
- [x] The seam exposes the current Account and its memberships; the owned diary is an `owner` membership keyed by diary id
- [x] Existing owner screens (hub, diet, grooming, feeding, edit, share) work unchanged against the new model — all five verified resolving the diary through the rewired `getDiary()`
- [x] A logged feeding reads "fed by {name}" using the Account's name (not the email prefix) — verified `by: "Sam"`
- [x] Header account menu shows name + email + sign out
- [x] Old single-diary storage migrates (or is re-seeded) without a crash for an existing local diary — verified: seeded legacy `pouncity_diary_v1` + `pouncity_session_v1` migrated into the account model, legacy keys retired

**Notes for the next slices:**
- Identity reattaches **by email**: `signIn(email)` finds the existing account for that email (id + name + memberships intact) rather than minting a new one, and `signOut()` clears only the current-account pointer (the accounts/diaries/memberships registries persist). This is what stops sign-out → return from orphaning the diary. The hub/create hardcode `signIn("you@pouncity.app")` as the single mock identity in this UI phase; all migration paths also land on that email, so reattach always matches.
- `writeDiary(diary)` (keyed by `diary.id`) is now the single write path for a diary — slices 04/05 that touch other people's diaries write through it too.
- `resolvePublicDiary(token)` / `registerHandoverOpen(token)` now search **all** diaries by token (not the signed-in owner's diary), so a public/caregiver reader with no owner account resolves correctly — this is the seam slice 02's handover gate builds on.
- `ensureMigrated()` is guarded by the presence of `pouncity_diaries_v1`: it runs once then no-ops forever. **For QA, clear all `pouncity_*` keys first** (or seed the new shape) — re-seeding the legacy keys after migration is silently ignored.
