# 07: Private Rating on current and past helpers

**What to build:** The Owner can leave a private star Rating and an optional note on any helper in their Circle, a current Caregiver or a Past Caregiver, at any time (there is no discrete handover to wait for; the link is standing). The Rating is visible only to the Owner, never to the Caregiver or anyone else, and it orders or flags the Circle so the most trusted helpers are easiest to reach next time. It can be edited later and survives a revoke and re-share of the link. The seam adds the Rating concept (stars, optional note, timestamp, tied to Owner Account, Caregiver Account, and Diary) and a private reader; the Circle renders it. No public or aggregated reputation is built (ADR-0005), and Caregivers never rate Owners or pets (the relationship stays one-way).

**Blocked by:** 01, 05.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] The Owner can set a star Rating and optional note on a current Caregiver and on a Past Caregiver from the Circle, at any time.
- [x] A Rating is readable only by the Owner who wrote it and never appears in the Caregiver's view of anything.
- [x] The Circle is ordered or flagged by the Owner's own Ratings.
- [x] Editing a Rating overwrites the stars and note; the Rating survives a revoke and re-share of the link.
- [x] No public or aggregated reputation is exposed anywhere, and a Caregiver cannot rate an Owner or a pet.
- [x] `tsc --noEmit` passes; a seam-level test asserts a Rating persists tied to (Owner, Caregiver, Diary) and is absent from the Caregiver's view.

## Build notes (2026-09-15)

- **Seam:** `Rating` type `{ownerAccountId, caregiverAccountId, diaryId, stars, note?, updatedAt}`; key `pouncity_ratings_v1` (defensive read, no migration). `getRating(caregiverId, diaryId)` reads against the CURRENT account as owner — so a caregiver only ever sees ratings THEY wrote, never the owner's (private by construction, ADR-0005). `setRating(...)` upserts one per (owner, caregiver, diary): editing overwrites, stars clamped 1-5, empty note dropped; keyed by account ids so it survives revoke/re-share.
- **UI unification:** `CaregiverList` + `PastCaregiverList` were Circle-only, so they were **deleted** and replaced by one `components/HelperRow.tsx` (avatar current=sun / past=muted, name, sublabel, the rating control, an inline note editor) + `components/StarRating.tsx` (5 tappable stars). The Circle renders current and past helper sections as sorted `HelperRow` lists (ordered by the owner's stars, unrated last; past ties break by end date). A star tap saves immediately; the note editor is only offered once ≥1 star is set (a rating is stars-first).
- Browser-verified: rate current Cara 5★ + Dan 3★ (both persist tied to owner+caregiver+diary; Cara sorts above Dan); edit Cara 5→2 (ONE record, list re-sorts Dan above); note on Cara persists + renders + keeps stars; as Cara, `/care/d_pip1` shows the pet but **no note, no stars, no rating control** (private + one-way); revoke → both become past helpers with ratings intact + ordered; rate a past helper directly (Dan 3→5); 360px zero overflow. `tsc` green.

**Epic status:** this completes the Circle (tickets 01, 02, 03, 04, 05, 07). Only **06 (handover health gate)** remains — independent, blocked by 02 (done).
