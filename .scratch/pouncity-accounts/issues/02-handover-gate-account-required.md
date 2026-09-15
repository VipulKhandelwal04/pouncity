# 02: Access requires an account — the handover gate

**What to build:** Opening a diary's Handover link / token while **signed out** shows a
**sign-in gate** — the pet's name and "Sign up to help with {pet}", and nothing else. No
anonymous diary render at all. This reworks the built handover view (`/d/[token]`, ticket
07) from "read the whole diary with no account" into the gate. The anonymous **Viewer**
role and the "recent opens" counter are retired from the seam. Per ADR-0004.

**Blocked by:** 01.

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] `/d/[token]` while signed out shows only the pet's name + "Sign up to help" — zero diary content leaks — verified: quirks / vet phone / diet portion / feeding entries all absent from the DOM; gate calls `getAccount()` alone (no signIn fallback), so an anonymous open mints no account (pointer stays null)
- [x] An invalid or revoked token shows the calm "this diary isn't shared" state (no leak) — verified on a wrong token, no pet name leaked
- [x] The anonymous read-only diary view is gone; `recentOpens` and `registerHandoverOpen` are removed from the seam — `resolvePublicDiary` (full-diary) replaced by `resolveHandoverGate(token) → {diaryId, petName}`
- [x] A signed-in Owner opening their own diary's link is sent to their diary, not the gate — verified redirect to `/diary`
- [x] Phone-width, one-handed — verified at a forced 360px column, 0 overflow

**What was built:**
- Seam: `HandoverState.recentOpens` removed (all writers updated); `registerHandoverOpen` removed; `resolvePublicDiary` replaced by **`resolveHandoverGate(token): {diaryId, petName} | null`** (leaks only the name — the gate *cannot* return diary content); added **`roleOnDiary(diaryId): Role | null`** and **`getDiaryById(diaryId)`** (both used by slices 03–04); `shareStatus` no longer shows an opens count ("Link live"). `handover.caregivers` kept as legacy (slice 06 retires it via memberships).
- `/d/[token]` reworked from the full read-only view into the gate: resolve → owner→`/diary`, caregiver→`/care/[diaryId]` (dormant until 03/04), else the name-only gate. CTA is "Sign up to help" → `/sign-in` (slice 04 makes it a real join + carries the token).
- Share page: removed the recent-opens block; reworded the not-shared blurb (no longer claims "no account to make").

**Note for later (out of scope here):** the marketing "How it works" step 04 still says a sitter needs "no account" — contradicts ADR-0004 now, but that page is pinned/mature; update when the marketing world is next touched.

**Seam note from slice 01:** identity now reattaches **by email** (`signIn(email)` → same
email = same Account). "A signed-in Owner opening their own link is sent to their diary" is
decided by comparing the opener's Account against the diary's owner membership — not by the
mock email. Keep in mind for slice 04: the sign-up-to-help flow must pass a **distinct email
per person**, or the caregiver collapses into the owner's account (see ticket 04's seam note).
