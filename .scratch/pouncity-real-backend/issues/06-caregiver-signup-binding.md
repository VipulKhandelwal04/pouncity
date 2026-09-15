# 06: Caregiver sign-up bound to a Diary

**What to build:** A sitter viewing via the link signs up and is bound as the single Caregiver for that specific Diary (ADR-0004 access requires an Account, ADR-0007 one Caregiver per pet). As a Caregiver they can log a Feeding confirm and opt into reminders, but gain no Owner rights, and their Access ends the moment the Owner revokes.

**Blocked by:** 04, 03.

**Status:** ready-for-agent

- [ ] A sitter signs up from the link and is bound as the one Caregiver for that Diary; a second would-be Caregiver is refused at the database (ADR-0007).
- [ ] The Caregiver can log a Feeding confirm and opt into reminders; they cannot edit ownership-level things.
- [ ] When the Owner revokes, the Caregiver's Access ends immediately.
- [ ] `tsc --noEmit` is green; a test proves the one-Caregiver-per-pet constraint and the loss of access on revoke.
