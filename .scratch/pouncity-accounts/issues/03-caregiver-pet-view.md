# 03: Caregiver pet view (`/care/[id]`)

**What to build:** The read-mostly screen a Caregiver sees for a pet they help with, at
`/care/[id]`. It shows the pet basics, diet plan, grooming guide, quirks and vet contact —
all **read-only** — plus the daily **Feeding confirm** as the one editable thing (attributed
to the caregiver's name) with **recent feeding history** read-only, and a reminder opt-in.
The owner-admin **records** (desexing / registration / rabies) and all edit / share /
regenerate / manage-access controls are **absent** (not merely disabled). It reads
unmistakably as a helper's view, not the owner's. Access ends the moment the owner revokes
the pet's link.

This slice is built and verified **against a seeded caregiver membership** — it needs no join
UI (that is the next slice). It carries the seam prefactor that caregiving depends on:
**diary-id-addressed** operations — read a specific diary's caregiver-visible view by id, and
**confirm feeding for a given diary id** (a caregiver is not the owner, so cannot go through
"the owner's one diary"). The confirm stays idempotent (one entry per date) and attributes to
the acting account's name; the owner's history and this recent-history read the same feeding
log through the seam.

**Blocked by:** 02.

**Status:** done (built + browser-verified 2026-09-14; local/uncommitted)

- [x] With a seeded caregiver membership, `/care/[id]` shows pet basics + diet plan + grooming guide + quirks + vet contact, all read-only — verified all present
- [x] The caregiver can log "fed today"; the entry is attributed to the caregiver's name and appears on the owner's feeding history — verified: `by:"Cara"` written to the shared diary; owner hub then shows "by Cara"
- [x] Recent feeding history is visible read-only; the owner's full calendar and the owner-only records are not shown — recent list (last 6), no `/diary/feeding` calendar link, no records
- [x] No edit / share / regenerate / manage-access controls appear anywhere on the view (absent from the DOM) — verified by **innerHTML scan**: no Spayed/Registered/Rabies/cert-expiry, no edit/share/diet/grooming/regenerate controls
- [x] The caregiver can opt into feeding reminders for that pet (per-diary; UI only) — reminders keyed by **(accountId, diaryId)**: owner's and caregiver's toggles for the same pet are independent
- [x] The view resolves only while the pet's handover link is live; a revoked/absent link ends access immediately with a calm "access ended" state — verified: token→null ⇒ "Access ended", no content leak (before slice 04's membership cleanup even runs)
- [x] A signed-out visitor to `/care/[id]` gets the sign-in gate, never diary content — verified redirect to `/d/<token>`, no leak; owner is redirected to `/diary`
- [x] Phone-width, one-handed — 0 overflow at forced 360px

**What was built:**
- Seam prefactor: feeding mutations are now **diary-id-addressed** — `confirmFeedingFor(diaryId, by)` / `undoFeedingFor(diaryId)` / `setTodayNoteFor(diaryId, note)` (old owner-scoped `confirmFeeding`/`undoFeeding`/`setTodayNote` removed — `FeedingTap` was the only caller). Reminders moved from one global key to **per (accountId, diaryId)** via `getFeedReminderFor(diaryId)` / `setFeedReminderFor(diaryId, on)` (read the current account internally). `FeedingTap` now keys everything off the `diary.id` it already receives, so the SAME component serves owner and caregiver unchanged.
- `app/care/[id]/page.tsx`: read-mostly caregiver view built from scratch (owner controls simply not rendered — nothing to hide). Resolution: `getAccount()` **alone** (no signIn fallback); role via `roleOnDiary(id)`; owner→`/diary`, no-live-token→"Access ended", signed-out/non-member→`/d/<token>` gate, caregiver+live-link→render. `FeedingTap` is the one editable thing (attributed to the caregiver). Reuses `AppHeader`, `PetAvatar`.

**Note carried to slice 04:** revoke must also **unbind the caregiver membership rows** — this view already ends access on a dead token, but the membership cleanup (so 05/06 lists stay clean) is slice 04's job.

**⚠️ Verification note (from slice 02):** unlike the gate, this view **receives the full
diary** (via `getDiaryById` — added in slice 02). So the seam does NOT withhold the
owner-only records; the view must **omit them from the DOM**. Verify "records / owner controls
absent" by DOM **absence** (`querySelector` returns nothing; scan `innerHTML`), NOT by
`innerText` — a rendered-but-CSS-hidden node is skipped by `innerText` and would false-pass
over a real leak. Also gate the view on a **live handover token** (revoke ⇒ view stops) and
call `getAccount()` per the caregiver's identity, not the owner's.
