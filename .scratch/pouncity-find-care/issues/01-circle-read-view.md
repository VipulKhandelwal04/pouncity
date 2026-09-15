# 01: Circle read view

**What to build:** A single `/diary/circle` screen that is the Owner's one place to see who helps with their pets and which pets they help with. It gathers the "who has access" named-Caregiver list (today on the share screen) and the "helping with" section (today on the home hub) onto one route. It shows the current Caregivers bound to the Owner's Diary by name, and the pets the Account helps with as a Caregiver, each with its fed-today status, and each opening its existing read-only caregiver view. An Owner with no Caregivers sees a calm empty Circle that explains how to invite someone. A caregiver-only Account sees only the helping-with section, no owner section. No stranger listing or browsable directory appears anywhere (ADR-0005). This ticket is the prefactor for the rest: extract the two existing lists into reusable pieces so the Circle and the old screens can both render them during the transition.

**Blocked by:** None (can start immediately).

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] `/diary/circle` renders the Owner's current Caregivers by name, read through the diary-service seam.
- [x] The pets the Account helps with appear, each showing whether it was fed today (Feeding confirm status).
- [x] Tapping a helped-with pet opens its existing read-only caregiver view.
- [x] An Owner with zero Caregivers sees an empty Circle that explains how to invite someone.
- [x] A caregiver-only Account sees only the helping-with section (no owner section).
- [x] No browsable directory or stranger listing appears anywhere on the screen (ADR-0005).
- [x] `tsc --noEmit` passes; the existing share and home screens still render their lists (no regression from the extraction).

## Build notes (2026-09-15)

- New route `app/diary/circle/page.tsx` (`DetailShell title="Your Circle"`), same mock-identity guard as the hub. Owner sees "People who help with {pet}" (named Caregivers or an empty state that explains inviting and links to Share for now) + "Pets you help with"; caregiver-only sees only "Pets you help with"; `!owned && no caregiving` redirects to `/diary`.
- **Prefactor (so the old screens render the same pieces, no drift 01→04):** extracted `components/HelpingWithList.tsx` (used by the hub + Circle) and `components/CaregiverList.tsx` (used by Share + Circle). The hub's `HelpingWith` and the Share page's "who has access" now delegate to these; browser-verified both still render unchanged.
- **Entry point + de-dup (revised on user feedback 2026-09-15):** the Circle entry is a **"Your Circle" card inside the owner's "{pet}'s care" group** (after "Share with a sitter"), with a helper-count status ("N helpers" / "No one yet"). To avoid the home and Circle showing the same helping-with list, the **owner home's inline "Helping with" section was removed** — it now lives only on the Circle (which the card opens). The **caregiver-only home keeps its "Helping with" list** (their home already is their circle-equivalent; no Circle card for them, since it would be redundant). Share card and `/join` link stay put (02/03 fold them in + retire them).
- Verified in-browser (seeded owner Sam + pet Pip + caregiver Cara + demo helping-with): all seven ACs incl. empty-Circle state, caregiver-only mode, literal `/care/[id]` navigation resolving to the read-only view, no-regression on hub + Share, and 360px content-box with zero overflow.

**Next slice:** frontier is now **02 (Circle invite + create-link)** and **03 (Circle join-by-code)** — both blocked only by 01, now unblocked.
