# Revoke ends access but retains a private past-caregiver record

**Status:** accepted (2026-09-15). Refines **ADR-0004** (access requires an account) and the whole-link revoke carried forward from **ADR-0003**.

When an **Owner** revokes a **Diary**'s **Handover link**, every live **Caregiver** **Membership** on that Diary is unbound and the link / **Referral code** dies (unchanged). What changes: the seam now retains a private **Past Caregiver** record for each Account whose access ended, readable only by the Owner, so the Owner keeps a history of who helped and can leave or update a private **Rating** on them from their **Circle**. The retained record is **not** a Membership and grants **no** access.

## Why this needs recording

ADR-0004 (and ADR-0003 before it) frames revoke as "unbinds every Caregiver on that diary at once," which a future reader will take to mean revoke leaves no trace of the Caregiver. It now leaves a private, access-less record behind. Without this ADR that retained data reads as either a contradiction of 0004 or an access-leak bug, when it is a deliberate, access-less history for the Owner.

## Considered options

- **Revoke wipes everything (ADR-0004 as-is)** — simplest, but the Owner loses all memory of who helped, so next time they choose a helper from memory and a Rating cannot outlive a link. Rejected: the Circle's whole point is a durable "who helps me" picture.
- **Revoke ends access, retains a private past-caregiver record (chosen)** — the Owner keeps their history and can Rate past helpers; access is genuinely gone. Costs one small retained record per past Caregiver and the discipline that it is never read as access.
- **Keep the Membership but flag it inactive** — rejected: an inactive Membership is still a Membership and risks leaking access through any code path that reads memberships without checking the flag. A separate, access-less record fails safe.

## Consequences

- The seam gains a private **Past Caregiver** record (Account identity, the Diary, when access ended), owned by and readable only by the Owner.
- "Who has access" still resolves to **live Caregivers only**; Past Caregivers are a separate, access-less list on the **Circle**.
- A **Rating** can attach to a current or a past Caregiver and survives a revoke and re-share of the link.
- Glossary (`CONTEXT.md`): adds **Past Caregiver**; the **Circle** term already covers current plus past helpers.
- Build tracked in `.scratch/pouncity-find-care/issues/` (tickets 04, 05, 07).
