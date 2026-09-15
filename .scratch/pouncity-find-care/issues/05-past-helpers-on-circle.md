# 05: Past helpers on the Circle

**What to build:** The Circle shows a Past Caregivers section listing the Accounts whose access ended, read from the retained records, kept distinct from current Caregivers so the Owner keeps their "who helped me before" history at a glance. A Past Caregiver shows the Account name and that access has ended, and exposes no live access.

**Blocked by:** 04.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] The Circle renders a Past Caregivers section from the retained records, visually distinct from current Caregivers.
- [x] A Past Caregiver shows the Account name and that access has ended; it opens no diary and grants no access.
- [x] When there are no past Caregivers, the section is absent or shows a calm empty state (no clutter).
- [x] `tsc --noEmit` passes.

## Build notes (2026-09-15)

- New `components/PastCaregiverList.tsx` — mirrors `CaregiverList`'s row but **muted** (panel/outline avatar vs the sun-filled current one) and **non-interactive** (no link — a past helper opens no diary), with an "Access ended {date}" sublabel. Takes `{account, endedAt}[]`.
- `app/diary/circle/page.tsx`: added `pastHelpers` state populated from `pastCaregivers(owned.id)` in the effect and refreshed in the revoke handler (so a just-revoked caregiver appears in past helpers immediately). Renders a **"Helped with {pet} before"** section between "People who help with {pet}" (current) and "Invite a helper", only when there are past helpers.
- Browser-verified: after ticket 04's revoke, "Helped with Pip before" lists Cara + Dan with "Access ended {date}", visually distinct from the empty current list, no links (open no diary); **reader exclusion (deferred from 04)** — Cara rejoins → she moves to "People who help with Pip" (current) and drops from past, Dan stays past; **sort** most-recent-first; **empty case** → section absent; 360px zero overflow. `tsc` green.

**Next slice:** frontier is now **06 (handover health gate)** and **07 (private Rating on current + past helpers)** — 07 is now unblocked (needs 01 + 05, both done).
