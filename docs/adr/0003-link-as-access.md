# Diary sharing is "link-as-access", not per-recipient grants

**Status:** partially superseded by ADR-0004 (2026-09-14). The **anonymous Viewer** / read-with-no-account decision below is **reversed** — access now requires an account. What carries forward from this ADR: a diary's access is still a **single standing link**, revocation is still **whole-link and per-diary**, and there is still **no per-recipient grant** (the Referral code is the same link in human-friendly form, not a per-person invite).

A diary's **Access** is a single standing **Handover link**. While the link is live, anyone holding it is an anonymous **Viewer** — read-only, with **no account and no individual identity** (Viewers are counted as recent opens, never named). A Viewer who signs up becomes a named **Caregiver** bound to that diary (can log the feeding confirm + opt into reminders, not edit or share). "Who has access" therefore resolves to **"the link is live (N recent opens) + these named Caregivers,"** and the only revocation is **whole-link revoke** (ejects everyone at once; a fresh link can then be issued). There is no per-recipient anonymous grant and no per-caregiver removal in the pilot.

## Why this needs recording

The Ticket Breakdown reads as if the owner can "see a list of who currently has access," which a future reader will take to mean every viewer is individually named and individually revocable. They are not — and the code will look "incomplete" against that reading unless this decision is on record.

## Considered options

- **Named viewers** — require even read-only viewers to identify themselves before seeing the diary. Rejected: contradicts the spec's "open with no account, no setup to view" and the zero-effort-handover wedge.
- **Per-sitter links** — a distinct revocable link per recipient. Rejected: turns handover into per-recipient setup, against the "one standing link, already done before you need it" wedge.
- **Per-caregiver removal** — keep the link live but eject one signed-up Caregiver. Deferred to v2; the pilot's revocation is whole-link only.

## Consequences

Owner peace-of-mind about *who* has access is partial by design: exact for signed-up Caregivers, aggregate ("N recent opens") for anonymous Viewers. Revoke is a single, confirmed, destructive-feeling action ("ends access for everyone; share a new link after"). This shapes the entire Share/handover surface (tickets 06–08) and the owner "admin" screen (ticket 07). Glossary: see **Access**, **Handover link**, **Owner**, **Viewer**, **Caregiver** in `CONTEXT.md`.
