# 04: Circle revoke, retaining the past Caregiver (ADR-0006)

**What to build:** Revoke already lives on the Circle (moved there with the rest of the handover surface in ticket 02). This ticket changes what revoke *does*: it now also retains a private Past Caregiver record for each Account whose access ended, kept for the Owner's history and future Rating, per ADR-0006 (which refines ADR-0004's "revoke unbinds every Caregiver" to "ends live access but retains a private, access-less record"). The seam owns the retention shape; this ticket adds the revoke-with-retention behavior and proves the retained record has no access. (The surface move + `/diary/share` retirement is done in 02, so this ticket is behavior + retention only; ticket 05 renders the past-helpers list.)

**Blocked by:** 02.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] Revoking from the Circle removes every live Caregiver Membership on the Diary and kills the link and code (existing behavior preserved).
- [x] After revoke, the seam retains a private Past Caregiver record (Account identity, the Diary, when access ended), readable only by the Owner.
- [x] The retained record is not a live Membership: the former Caregiver has no access to the Diary and it does not appear in "who has access."
- [x] `tsc --noEmit` passes; a seam-level test asserts the retained record persists after revoke and grants no read access.

## Build notes (2026-09-15)

- Seam-only slice (no UI — ticket 05 renders the list). `lib/diary-service.ts` gained: `PastCaregiver` type `{accountId, diaryId, endedAt}`; key `pouncity_past_caregivers_v1` (defensive read, no migration needed); `revokeHandoverLink()` now captures the ending caregiver memberships and calls `retainPastCaregivers(diaryId, accountIds)` BEFORE dropping them; a reader `pastCaregivers(diaryId): {account, endedAt}[]` (resolves names, most-recent first, **excludes anyone who has since rejoined** as a live caregiver — past = no live membership, per CONTEXT.md).
- **Dedup:** one record per (account, diary) — a re-revoked caregiver updates `endedAt` to the latest, never duplicates.
- Browser seam-test (in-browser state assertion, the repo pattern): seeded Sam + Pip (shared) + Cara & Dan caregivers → revoke via the real Circle UI → both retained in `pouncity_past_caregivers_v1` with `endedAt`, both memberships dropped, owner intact, token null, "who has access" shows "No one yet". Re-share + Cara rejoins + revoke again → Cara stays ONE record with an advanced `endedAt` (dedup). Switched to Cara → `/care/d_pip1` shows "Access ended" and **leaks none of Pip's private content** (full innerHTML scan for quirk + vet phone). `tsc` green.
- The reader's exclusion/sort get their DOM verification in **ticket 05** (which renders the list).

**Next slice:** frontier is now **05 (Past helpers on the Circle)** — renders `pastCaregivers(diaryId)` — and **06 (handover health gate)**. Dev state left with Pip revoked + Cara & Dan as past caregivers, ready for 05.
