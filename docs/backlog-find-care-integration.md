# Backlog: Find Care prototype vs the built app

Grilled 2026-09-15. Scope boundary in
[ADR-0005](./adr/0005-find-care-referral-only.md); access model in
[ADR-0003](./adr/0003-link-as-access.md) / [ADR-0004](./adr/0004-access-requires-account.md);
glossary in [/CONTEXT.md](../CONTEXT.md). The signed-in app lives in `V2/`;
everything routes through the one seam, `V2/lib/diary-service.ts`.

## Already built - verify only, no new work

The accounts & caregiving epic already covers most of the prototype's diary and
handover surface:

- Sign-in (passwordless email magic link + Google, mock)
- Account model; per-diary **Owner** / **Caregiver** roles; **Membership**
- **Handover link** = **Referral code** (same token); account-gated sign-in gate
- Caregiver view `/care/[id]` (read-only + the daily feeding confirm)
- Caregiver join + binding; revoke unbinds every caregiver on that diary
- Dual-role home ("Your pet" + "Helping with"); the owner-as-caregiver journey
- No streak (calm feeding history) - already the case

## New work - the real delta from the prototype

### N1 - Circle screen (consolidation; Find Care collapses in)
Unify the existing "Who has access" (share page) and "Helping with" (home) into
one **Circle** surface with two labelled actions: "invite someone to help" and
"helping with a pet? enter their code". No separate Find Care tab.
- **Seam**: reuse `diaryCaregivers`, `getMemberships`, `joinAsCaregiver`,
  `handoverCode` - nothing new.
- **Routes**: new `app/circle`; move code entry off `/join` onto it.

### N2 - Private one-way Rating
Owner leaves stars + note on a Caregiver after a handover ends; visible only to
that Owner; orders / flags their Circle.
- **Seam**: new `Rating` type + `rateCaregiver(diaryId, caregiverAccountId,
  stars, note)`, stored private to the owner.
- **Routes**: a post-handover prompt; surfaced on Circle (N1).
- **Boundary**: public / aggregated reputation is out of scope (ADR-0005).

### N3 - Handover health gate
Block `regenerateHandoverLink` / `ensureHandoverLink` until the pet's health set
is complete: species/breed, rabies status, vet contact, "anything a caregiver
should know". Health fields already exist (`neuterStatus`, `registered`,
`rabies`).
- **Routes**: `app/diary/share` (the gate + a prompt to complete the missing
  fields). Create stays minimal / optional.

## Multi-pet ownership - declined for now (decided 2026-09-15)

The prototype supports several pets per owner, but **one pet per owner Account
stays the pilot scope** (`CONTEXT.md` Diary + Membership, carried by ADR-0004).
It would also reverse more than a data model - the built accounts epic assumes a
single owned diary throughout (`getDiary()` returns one; the hub's singular "Your
pet") - so it is not a cheap add. Revisit as a later pilot-phase decision.

## Not building

- **The streak** - the prototype has one; it violates the no-guilt rail. Feeding
  stays calm history.
- **The marketplace epic** (ADR-0005): verified-sitter marketplace, sitter
  onboarding / profile, identity verification, requests inbox, dual profile,
  role chooser, public reputation. Gated on a verification provider.
