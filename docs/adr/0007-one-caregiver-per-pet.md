# One Caregiver per pet at a time

**Status:** accepted (2026-09-15). Refines **ADR-0003** (link-as-access) and **ADR-0004** (access-requires-account), which spoke of "Caregivers" (plural) on a diary.

A **Diary** has **at most one Caregiver at a time** (plus its **Owner**). A Caregiver can help with many pets (caregiver → pets is one-to-many), but each pet has exactly one active Caregiver. The many "caregivers" of a pet are its **Past Caregivers** over time (history, ADR-0006), never simultaneous helpers. Joining a pet that already has a Caregiver is refused — on the link gate (`/d/[token]`) and on code entry alike — and the Owner ends the current care before a new helper can take the spot.

## Why this needs recording

The earlier model, and the first build of the accounts + Find Care epics, allowed **multiple simultaneous Caregivers** per diary: "who has access" was a list of "named Caregivers," and revoke "unbinds every Caregiver." The product is the **temporary-handover** model — you hand your pet to *a* sitter at a time — so the plural was wrong. Recording the 1:1 keeps the reworked single-caregiver surfaces (one caregiver row, an "End care" action, an "invite" surface that only shows when the spot is open) from reading as a regression against the older ADRs.

## Considered options

- **Many caregivers per pet (as first built)** — a household / circle of simultaneous helpers. Rejected: it doesn't match "temporary handover to a sitter," muddies "who is responsible right now," and makes ending care ambiguous (per-caregiver removal, which a single shared standing code can't cleanly support).
- **One Caregiver per pet at a time (chosen)** — matches the handover model, makes ending care unambiguous (there is exactly one), and Past Caregivers carry the history and Ratings. Cost: two people cannot help simultaneously (a partner plus a weekend sitter can't both hold the pet; you hand off to one at a time).
- **Per-recipient invite tokens** (each helper gets their own code) — would allow multiple helpers and clean per-person removal, but it is a bigger model change; deferred.

## Consequences

- Seam: `joinAsCaregiver` refuses to bind a second Caregiver; the plural `diaryCaregivers` is replaced by `diaryCaregiver(diaryId): Account | null`.
- Circle: "who cares for the pet" is one Caregiver row plus an **End care** action; the invite surface renders only when the single spot is open; Past Caregivers can still be many.
- Gate (`/d/[token]`): opening a link for a pet that already has a Caregiver shows a calm "already has a caregiver" state instead of binding.
- Ending care (the whole-link revoke) is unchanged mechanically — it always ends the one Caregiver, who is retained as a **Past Caregiver** (ADR-0006).
- Glossary (`CONTEXT.md`): **Caregiver**, **Access**, **Circle** updated to "one at a time."
- Build tracked with the Find Care epic in `.scratch/pouncity-find-care/`.
