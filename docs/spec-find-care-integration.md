# Spec — Owner app: Find Care integration (Circle, Rating, handover health gate)

Status: ready-for-agent
**Scope:** the net-new work from comparing the built app against the shared
"Pouncity Find Care" prototype. Covered here: **N1 Circle screen**, **N2 private
Rating**, **N3 handover health gate** (see `docs/backlog-find-care-integration.md`).
**Respects:** ADR-0003 / ADR-0004 (link-as-access; access requires an account),
ADR-0005 (Find Care stays referral-only; the marketplace is deferred), ADR-0006
(revoke ends access but retains a private past-caregiver record).
**Glossary:** uses `CONTEXT.md` terms throughout — Account, Owner, Caregiver,
Diary, Handover link, Referral code, **Circle**, **Rating**, Feeding confirm.
**Seam:** the single `diary-service` seam, expanded (no new module).

## Problem Statement

I can already share my pet with a helper through a standing link or referral
code, and I can help with other people's pets. But the people in my life who help
with my pets, and the pets I help with, are scattered — some on the share screen,
some on the home screen — so I never see my "who helps me" picture in one place.
After a handover ends I have no way to remember how it went, so next time I am
choosing a helper from memory. And nothing stops me handing my pet to a caregiver
before I have filled in its safety-critical basics (rabies, vet), which leaves my
helper without what they need in an emergency. Separately, the "Find Care"
prototype makes it look like I should be able to browse and book strangers — but
that is not the product I want.

## Solution

One **Circle** screen gathers everyone who helps with my pets and every pet I
help with, with two clear actions: invite someone to help (share my link or
code) and "helping with a pet? enter their code." Finding care means bringing a
trusted person into my Circle by referral — there is no separate discovery tab
and no strangers (ADR-0005). After a handover ends, I can leave a private star
**Rating** and an optional note on a Caregiver, visible only to me, so my Circle
remembers who did well. And when I go to share a pet, the app first makes sure
its health essentials are filled in, so no caregiver is ever handed a pet without
them.

## User Stories

1. As an Owner, I want a single Circle screen, so that I can see everyone who
   helps with my pets without hunting across the app.
2. As an Owner, I want my Circle to list each Caregiver bound to my Diary by
   name, so that I know exactly who has access.
3. As an Owner, I want my Circle to also show the pets I help with as a
   Caregiver, so that both sides of my caregiving life are in one place.
4. As an Owner, I want an "invite someone to help" action on the Circle screen,
   so that I can share my pet's Handover link or Referral code from where I
   manage access.
5. As an Owner, I want to copy my pet's Referral code from the Circle screen, so
   that I can read it out over a call or chat.
6. As any Account, I want a "helping with a pet? enter their code" action on the
   Circle screen, so that I can join a pet's Diary as a Caregiver.
7. As a Caregiver, I want each pet I help with to open its read-only caregiver
   view from the Circle, so that I can log the daily Feeding confirm.
8. As an Owner, I want to open a Caregiver's detail from my Circle, so that I can
   see who they are and manage their access.
9. As an Owner, I want to revoke a pet's Handover link from the Circle, so that I
   can end access for everyone on that Diary in one place.
10. As an Owner, I want the Circle to show whether each helped-with pet was fed
    today, so that I have a calm at-a-glance status.
11. As an Owner with no Caregivers yet, I want a clear empty Circle that explains
    how to invite someone, so that I know what to do next.
12. As a caregiver-only Account, I want my Circle to show only the pets I help
    with (no owner section), so that the screen fits my situation.
13. As an Owner, I never want my Circle to surface strangers or a browsable
    directory, so that the product stays trust-first (ADR-0005).
14. As an Owner, I want to leave a private star Rating on any helper in my
    Circle, a current or a past Caregiver, so that I can remember how they did.
15. As an Owner, I want to add an optional note to a Rating, so that I can record
    a detail the stars alone do not capture.
16. As an Owner, I want my Ratings to be private to me, so that rating a friend
    never becomes a public or social act.
17. As an Owner, I want a Caregiver never to see the Rating I gave them, so that
    honesty costs nothing.
18. As an Owner, I want my Circle ordered or flagged by my own Ratings, so that
    the helpers I trust most are easiest to reach next time.
19. As an Owner, I want to change a Rating I left earlier, so that I can correct
    it after more experience with a Caregiver.
20. As an Owner, I want to rate a Caregiver who is currently helping without
    waiting for a handover to end, so that I can capture how it is going while it
    is fresh.
21. As a Caregiver, I never want to rate the Owner or the pet, so that the
    relationship stays one-way inside my trusted circle (no marketplace
    two-sided rating).
22. As an Owner, I want no public or aggregated reputation score anywhere, so
    that the app does not quietly become a marketplace (ADR-0005).
23. As an Owner, when I go to create or regenerate a pet's Handover link, I want
    the app to check the pet's health essentials first, so that I never hand over
    a pet without them.
24. As an Owner, if health essentials are missing, I want to be told exactly
    which fields to complete, so that I can fix it quickly.
25. As an Owner, I want the required set to be the pet's species/breed, rabies
    status, vet contact, and "anything a caregiver should know," so that a helper
    has what an emergency needs.
26. As an Owner, once I complete the missing fields, I want to continue to
    creating the link without starting over, so that the gate is a nudge, not a
    wall.
27. As an Owner, I want everything beyond the required set to stay optional, so
    that setting up my pet stays calm and low-friction.
28. As an Owner, I do not want the health gate to fire anywhere except at
    handover creation, so that daily use is never interrupted.
29. As a Caregiver, I want to trust that any pet handed to me already has its
    rabies and vet details, so that I am never caught without them.
30. As an Owner, I want to keep owning exactly one pet in this pilot, so that the
    app stays simple (multi-pet is out of scope).
31. As an Owner, I never want a feeding streak, so that missing a day is never
    made to feel like failure.
32. As an Owner, I want my Circle, Ratings, and the health gate to work whether I
    am signed in on the owner side or acting as a Caregiver elsewhere, so that my
    two roles never collide.
33. As an Owner, I want revoking a link to also clear the corresponding
    Caregivers from my Circle immediately, so that the screen always tells the
    truth about who has access.
34. As an Owner, I want a Rating I left to survive after I revoke and re-share,
    so that my memory of a helper is not wiped by re-issuing a link.

## Implementation Decisions

- **One seam, expanded (the established rule).** All behavior stays behind the
  single `diary-service` seam; no screen touches storage/network/LLM directly,
  and no second module is introduced. N1 reuses existing seam operations; N2 adds
  Rating operations; N3 adds a handover-readiness predicate.
- **Circle is consolidation, not new plumbing (N1).** It gathers the existing
  "who has access" list (from the share surface) and the "helping with" section
  (from the home) onto one route, reading named Caregivers and caregiving diaries
  through the seam's existing membership operations, and the standing link / code
  through the existing handover operations. "Find Care" collapses into this
  screen as its invite/refer and enter-code actions; there is no discovery tab
  and no stranger listing (ADR-0005). Access is still earned only by referral
  (ADR-0003 / ADR-0004).
- **Rating is a new, private, one-way seam concept (N2).** A Rating records
  stars, an optional note, and a timestamp, tied to (Owner Account, Caregiver
  Account, Diary). It is written and read only for the owning Account, never
  exposed to the Caregiver or aggregated across Owners. It can be left or updated
  at any time from the Circle on a current or a past Caregiver (there is no
  discrete handover to rate; the link is standing), is editable by the Owner, and
  orders/flags the Circle. A Rating survives a revoke and re-share, and a past
  Caregiver is retained for exactly this (ADR-0006). Public / aggregated
  reputation is explicitly not built (ADR-0005). The seam owns the storage shape;
  the Circle screen renders it.
- **The health gate is a seam predicate enforced by the share flow (N3).** The
  seam exposes a readiness check for a Diary that reports the missing required
  fields; creating or regenerating a Handover link is blocked until the required
  set is present. The required set is species/breed, rabies status, vet contact,
  and the free-text "anything a caregiver should know." These fields already
  exist on the Diary shape, so this is validation and a completion prompt, not a
  schema addition. The gate fires only at handover creation/regeneration —
  nowhere else — and pet creation stays minimal with everything else optional.
- **Referral-only and one-pet-per-owner are held (ADR-0005; pilot scope).** No
  marketplace, no sitter entity (a paid sitter stays a context of a Caregiver),
  and one Diary per owner Account. Multi-pet ownership was considered and
  declined on 2026-09-15.
- **No streak.** The prototype's feeding streak is deliberately not adopted; the
  Feeding confirm stays a calm history.

## Testing Decisions

- **A good test asserts external behavior at the seam and in the rendered
  screen, not internals.** It observes the persisted state the seam produced
  (accounts, diaries, memberships, ratings) and what the screen renders, given a
  seeded state and an action through the seam or the UI.
- **The seam under test is `diary-service`** — the single module. Discriminating
  checks are expressed as: given a seeded state (accounts, diaries, memberships,
  and for N2 prior ratings), and an action through the seam or UI, then the
  resulting persisted state and rendered DOM hold.
- **Prior art (the established pattern in this repo):** `tsc --noEmit` as the
  type gate, plus in-browser DOM/state assertions driven against a seeded
  `localStorage`, as used per-slice throughout the accounts & caregiving epic.
- **Per-ticket discriminating checks:**
  - **N1 Circle:** seed an Owner with a pet plus two bound Caregivers and one
    helped-with pet; the Circle lists both Caregivers by name and the helped-with
    pet with its fed-today status; invite and enter-code actions are present;
    revoking from the Circle empties the Caregiver list and kills the link/code.
  - **N2 Rating:** seed an Owner with one bound Caregiver and one past Caregiver;
    the Owner leaves 4 stars + a note on each; assert each Rating persists tied to
    (owner, caregiver, diary), is not present in the Caregiver's view of anything,
    survives a revoke and re-share, and re-orders the Circle; editing it
    overwrites the stars/note.
  - **N3 health gate:** seed a Diary missing rabies + vet; attempting to create a
    Handover link is blocked and names exactly the missing fields; after
    completing them, link creation proceeds without restarting; the gate does not
    fire on any non-handover screen.
- **No test framework is added** (consistent with the UI-first slices); `tsc` +
  the browser DOM/state pattern is the verification, run per ticket before it is
  marked done.

## Out of Scope

- **The entire marketplace epic (ADR-0005):** public verified-sitter marketplace
  / stranger discovery, sitter onboarding, public sitter profile, identity
  verification, requests / booking inbox, dual owner+sitter profile,
  owner-vs-sitter role chooser, and any public / aggregated reputation.
- **Multi-pet ownership** — declined 2026-09-15; one pet per owner Account stays
  the pilot scope.
- **A feeding streak** — deliberately not built.
- **Real backend** (Supabase auth/db, AI Gateway), web-push delivery, and
  per-Caregiver removal (whole-link revoke stays the model) — consistent with the
  prior specs; these arrive behind the same seam later.

## Further Notes

- **Provenance:** grilled 2026-09-15 against the shared "Pouncity Find Care"
  prototype; most of that prototype's diary + handover surface is already built
  (the accounts & caregiving epic), so this spec covers only the genuine delta.
  See `docs/backlog-find-care-integration.md` for the built-vs-new split.
- **Publishing:** this repo's issue tracker is local markdown
  (`docs/agents/issue-tracker.md`), with specs under `docs/`. This spec is
  published here and labelled `Status: ready-for-agent` at the top. Break it into
  tickets under `.scratch/pouncity-find-care/issues/` with `/to-tickets`.
