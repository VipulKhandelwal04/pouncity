# Spec — Owner app: Accounts & multi-owner caregiving (slices 02–06)

> Derived from the 2026-09-14 `/grill-with-docs` design session and the epic in
> `.scratch/pouncity-accounts/issues/` (README + slices 01–06). Slice **01 (Account identity,
> name capture & attribution) is built and verified** — this spec covers the remaining pending
> work, slices **02–06**. No external issue tracker is configured; the tracker of record is the
> local ticket set in `.scratch/pouncity-accounts/issues/`, each already carrying the
> `ready-for-agent` status. This spec is the synthesis behind those tickets.
>
> Uses the `CONTEXT.md` glossary: **Account** (a person's identity — id, name, email),
> **Membership** (binds an Account to a Diary with a **Role**: `owner` | `caregiver`), **Owner**
> and **Caregiver** (per-diary roles, never global), **Diary** (the single living record per pet),
> **Handover link** (a standing read-only share, one token per diary), **Referral code** (the same
> token in a human-readable form). The anonymous **Viewer** role is **retired** (ADR-0004). Governed
> by **ADR-0004** (access requires an account; supersedes the anonymous-viewer part of ADR-0003).

## Problem Statement

A person using Pouncity is more than "the owner of one pet." The same person often **owns their own
pet and helps look after someone else's** — a sitter, a partner, a family member, a neighbour — and
some people help with pets while owning none. Today the app assumes exactly one identity with exactly
one pet, and "sharing" means handing out a link that renders the whole diary to anyone, no account
required. That leaves three gaps the owner and their helpers feel directly:

1. **No real identity.** There is no profile — no stable "who am I", no name that follows me across
   the pets I touch. Feeding was attributed to an email prefix, not a person. (Slice 01 introduced the
   Account; slices 02–06 build the multi-pet, multi-role life on top of it.)
2. **Sharing has no front door and no roles.** Anyone with the link reads everything, anonymously.
   There is no notion of "this person is helping with my pet" — no named list, no way for a helper to
   *do* anything (like log a feed), and no account boundary protecting the diary.
3. **A helper has nowhere to stand.** Someone caring for two other people's pets has no home that
   shows "the pets I help with," no per-pet screen scoped to what a helper should see and do, and
   no way to join a pet by a code read out over a call.

Without accounts, per-diary roles, a gated handover, a caregiver's own view, and a home that holds
both roles at once, the product's core promise — *calm, trusted, zero-effort handover of pet care* —
cannot actually be handed to the people who do the caring.

## Solution

Turn single-owner sharing into a **dual-role model** on the existing one-seam architecture, entirely
UI-first (mock behind `diary-service`; real auth/DB later). A person is an **Account**; **Owner** and
**Caregiver** are **per-diary roles** held via **Memberships**. One Account can own its pet *and* help
with others' at the same time; a caregiver-only Account owns nothing. Reading a diary requires an
account.

- **The handover gate (02).** Opening a Handover link or Referral code while **signed out** shows a
  sign-in gate — the pet's name and "Sign up to help with {pet}", and nothing else. No diary content
  is rendered without an account. A signed-in owner opening their own link lands on their diary, not
  the gate. The anonymous Viewer and the "recent opens" counter are retired.
- **Caregiver pet view (03) at `/care/[id]`.** A read-mostly screen scoped to a helper: pet basics,
  diet plan, grooming guide, quirks and vet contact — all read-only — plus the daily **Feeding
  confirm** as the one editable thing (attributed to the caregiver's name), recent feeding history
  read-only, and a reminder opt-in. Owner-only records (desexing / registration / rabies) and every
  edit / share / regenerate / manage-access control are **absent**, not merely disabled. Built and
  verified against a seeded caregiver membership, so it stands before the join that lands on it.
- **Caregiver join + binding (04).** From the gate, signing up (or, if already signed in, a one-tap
  "Help with {pet}") binds a **caregiver Membership** to that diary and lands the person on the pet's
  caregiver view. One Account can be a caregiver on many diaries from different owners at once. Access
  ends the moment the owner revokes the link.
- **Dual-role home (05).** `/diary` gains a **"Helping with"** section beside the owner's "Your pet."
  A caregiver-only account is never force-redirected to create a diary — it sees "Helping with" plus a
  gentle, skippable "create your own pet's diary." Because the mock is single-browser, "Helping with"
  is seeded with 1–2 clearly-labeled **demo** caregiving pets.
- **Referral code + reworked Share list (06).** The owner's Share page shows a stable, human-friendly
  **Referral code** beside the link — the same token, readable aloud. "Join a pet with a code" exists
  on the gate and inside the app. "Who has access" becomes the **named Caregivers** list ("recent
  opens" is gone). Revoking unbinds every caregiver and kills both the code and the link.

Everything stays mobile-web, calm, one-handed, in Operate mode.

## User Stories

**Identity & the account that spans pets (foundation from 01, exercised throughout)**
1. As a person using the app, I want a single Account (name + email) that follows me across every pet I own or help with, so that I am one identity, not one-per-pet.
2. As a returning user, I want the app to know who I am without asking my name again, so that sign-in is frictionless.
3. As anyone logging a feed, I want it attributed to my **name**, so that the owner sees who fed the pet, not an email fragment.

**The handover gate — access requires an account (slice 02)**
4. As a person opening a handover link while signed out, I want to see only the pet's name and an invitation to help, so that no one reads a diary without an account.
5. As that same person, I do **not** want to see feeding, quirks, vet, diet or grooming before I have an account, so that the owner's data is protected by the account boundary.
6. As an owner opening my *own* pet's link while signed in, I want to be taken straight to my diary, not a gate, so that the link is safe for me to click too.
7. As a caregiver already bound to a pet, I want opening its link again to just open the pet, so that clicking a shared link is idempotent and never creates a mess.
8. As anyone opening an invalid or revoked link, I want a calm "this diary isn't shared" message with no data, so that dead links fail safely.
9. As an owner, I want the anonymous "read the whole diary with no account" path gone entirely, so that access is always tied to a known person.

**Caregiver join + binding (slice 04)**
10. As a first-time helper on the gate, I want to sign up (mock magic-link / Google) and be bound to that pet as a caregiver, so that I can start helping immediately.
11. As an already-signed-in person, I want a one-tap "Help with {pet}" that binds me without re-authenticating, so that joining is instant when I'm already known.
12. As a new caregiver, I want to land on that pet's caregiver view right after joining, so that the next thing I see is what I came to do.
13. As a person who helps several families, I want to be a caregiver on many pets from different owners at once, so that one account covers all my caregiving.
14. As a caregiver, I want re-opening a link I'm already bound to to *not* create a duplicate binding, so that my access list stays clean.
15. As a caregiver, I want my access to end the instant the owner revokes that pet's link, so that the boundary is real and immediate.
16. As two different helpers, we each want our own Account (distinct identity) when we join the same pet, so that our feeds and access are not merged into one person.

**Caregiver pet view — `/care/[id]` (slice 03)**
17. As a caregiver, I want to see the pet's basics, diet plan, grooming guide, quirks and vet contact, so that I can care for the pet correctly.
18. As a caregiver, I want all of that to be clearly read-only, so that I understand I'm helping, not administering the diary.
19. As a caregiver, I want to log "fed today" and have it show on the owner's history attributed to me, so that the owner can trust the pet was fed and by whom.
20. As a caregiver, I want to see recent feeding history so that I don't double-feed or miss a meal, without seeing the owner's full calendar or private records.
21. As a caregiver, I do **not** want to see the owner's desexing / registration / rabies records or any edit / share / regenerate / manage-access control, so that the view is scoped to helping.
22. As a caregiver, I want to opt into feeding reminders for a pet I help with, so that I don't forget on days I'm responsible.
23. As a caregiver whose access was just revoked, I want the view to stop working, so that I'm not acting on a pet I no longer help with.
24. As a caregiver on my phone, I want the whole view to work one-handed, so that I can use it while actually with the pet.

**Dual-role home — "Helping with" (slice 05)**
25. As a person who owns a pet and helps with others, I want my home to show both "Your pet" and "Helping with," so that both roles live in one place.
26. As a caregiver-only account (I own no pet), I want to **not** be forced to create a diary, so that the app fits me even though I don't have my own pet.
27. As a caregiver-only account, I want a gentle, skippable "create your own pet's diary" prompt, so that the option is there without nagging.
28. As a user, I want each "Helping with" entry to open that pet's caregiver view, so that the home is a real launchpad into the pets I help with.
29. As a user, I want demo caregiving pets to be visibly marked as demo, so that I'm never confused about what's real while the backend is mocked.
30. As a brand-new account with no owned or caregiving pet, I want a sensible first-run state (create one, or wait for a link), so that an empty home still tells me what to do.

**Referral code + reworked Share access list (slice 06)**
31. As an owner, I want a human-friendly referral code shown beside my link, so that I can read it out over a call or text instead of pasting a URL.
32. As an owner, I want the code and the link to encode the **same** standing token, so that there is one access, one revoke, not two things to manage.
33. As a helper, I want to join a pet by typing the code — from the gate or from inside the app — so that a URL isn't the only way in.
34. As an owner, I want the code to change only when I regenerate or revoke, with no separate expiry, so that it behaves like the one link it mirrors.
35. As an owner, I want "Who has access" to list the **named caregivers**, so that I see the actual people helping, not an anonymous count.
36. As an owner, I do **not** want a "recent opens" count anywhere anymore, so that access reads as people, not surveillance.
37. As an owner, I want revoking to unbind every caregiver and stop both the code and the link, so that "end access" is one clean, total action.
38. As an owner, I want copy / share affordances to name the action clearly (read-out code vs shareable link), so that I pick the right one for the situation.

## Implementation Decisions

- **One seam, expanded (confirmed with the user).** All behavior stays behind the single
  `diary-service` seam — the load-bearing rule of the whole app. No second module for caregiving; no
  screen touches storage / network / an LLM directly. The seam grows **diary-id-addressed**
  operations rather than a parallel service, because caregivers act on *a specific pet by id*, not
  "the signed-in owner's one pet."

- **The identity model (built in slice 01; prototype type shapes, kept precise):**
  ```ts
  type Role = "owner" | "caregiver";
  interface Account    { id: string; name: string; email: string; } // name "" until captured
  interface Membership { accountId: string; diaryId: string; role: Role; } // roles are per-diary
  ```
  Storage is an accounts registry keyed by id, a current-account pointer, diaries keyed by id, and a
  memberships list. `getDiary()` resolves the current account's **owner** membership; every diary
  write goes through a single internal id-keyed write path. `signIn(email)` **reattaches by email**
  (same email ⇒ same Account, keeping id + name + memberships); `signOut()` clears only the
  current-account pointer.

- **Distinct mock identity per person (the load-bearing constraint for 02/03).** Because `signIn`
  reattaches by email, the mock sign-in used by the join flow **must pass a distinct email per
  person**. The owner screens hardcode a single mock identity today; reusing it for a caregiver would
  **collapse caregiver and owner into one Account** and destroy the entire role distinction. So the
  gate/join flow captures or generates a per-person mock email, and seeded demo caregivers each carry
  their own email. This is a designed step, recorded in tickets 02 and 03.

- **Token/referral resolution splits from full-diary read (slice 02, ADR-0004).** Resolving a token
  or code for a **signed-out opener** returns only what the gate needs — the pet's name — and never
  diary content. Full diary access is a function of the viewer's Membership on that diary, resolved
  after sign-in. The anonymous full-diary resolve, the `recentOpens` counter, and the "register an
  anonymous open" operation are **removed** from the seam.

- **A Referral code is a rendering of the token, not a second credential (slice 06).** One standing
  token per diary underlies both the link and the human-readable code; the seam maps code ⇄ token.
  There is no per-person invite and no separate expiry — regenerate mints a new token (old link + old
  code die together); revoke clears it entirely.

- **Feeding and reads become diary-id-addressed for caregivers (slice 03).** The feeding-confirm and
  the read the caregiver view consumes take an explicit diary id (a caregiver is not the owner, so
  they cannot go through `getDiary()`). The confirm remains idempotent (one entry per date) and is
  attributed to the acting Account's **name**; the owner's history and the caregiver's recent-history
  read the same underlying feeding log through the seam. Caregiver reminder opt-in is per-diary.

- **The caregiver-visible projection is defined at the seam, enforced by the screen.** The seam
  exposes what a caregiver may see for a given diary (basics, diet, grooming, quirks, vet, recent
  feeding); the `/care/[id]` screen renders only that and **omits** owner-only records and all
  edit / share / regenerate / manage controls (absent from the DOM, not merely hidden/disabled).

- **Role-aware routing.** Opening a diary resolves the viewer's role on it: **owner → their diary**,
  **caregiver → `/care/[id]`**, **no membership + signed out → the gate**, **no membership + signed
  in → the join affordance**. The home reads the current account's memberships and splits them into
  the owned pet ("Your pet") and caregiving pets ("Helping with").

- **Revoke is the single kill switch (owned by the join slice 04; relied on by 03 and 06).** Revoking
  a diary's handover clears the token and **unbinds every caregiver Membership on that diary** in one
  action; the link + code both go dead. The caregiver view (03) stops resolving the instant the link
  is dead — it gates on a live token, so "revoke ends access" works even before the membership rows
  are cleaned up; the join slice (04) adds that cleanup so the caregiver lists in 05/06 don't show
  dead entries. Caregiver memberships on *other* diaries are untouched. Per-caregiver removal is out
  of scope (v2).

- **Demo caregiving data for the single-browser mock (slice 05).** Since the mock has no real
  cross-account data, "Helping with" is seeded with 1–2 caregiving pets carrying a visible **demo**
  marker; they are constructed to disappear cleanly once real backend data exists.

- **Reworks, not net-new, of the shipped share surface.** These slices rework the previously built
  handover view (old ticket 07 → the gate), share/admin surface (old ticket 08 → named caregivers +
  referral code, no recent-opens), and caregiver sign-up (old ticket 09 → account-based join). The old
  07/09 are not to be built as originally written.

## Testing Decisions

- **What makes a good test here: assert external behavior at the seam and in the rendered screen — not
  internals.** A good check observes (a) the **persisted state** the seam produced (accounts, diaries
  by id, memberships, feeding log entries with their attribution), and (b) **what the screen actually
  renders or omits** (the gate leaks zero diary content; `/care/[id]` has no edit/share/records
  controls in the DOM; "Helping with" lists the seeded pets). It never asserts on private variables,
  storage key names, or call order.

- **The seam under test is `diary-service`** — the single module. Because it is the one seam, the
  discriminating checks for every slice are expressed as: *given* a seeded state (accounts, diaries,
  memberships) *and* an action through the seam or the UI, *then* the resulting persisted state and
  rendered DOM. Prior art is exactly how slices 01–08 were verified.

- **Prior art (the established verification pattern in this repo):** `tsc --noEmit` as the type gate,
  plus in-browser **DOM/state assertions** driven against a seeded `localStorage` — read back the
  persisted shape and read the rendered `innerText` / element presence, rather than eyeballing
  screenshots. Slice 01's verification is the template: seed a shape, act, assert the persisted
  registries and the rendered screen; use forced narrow width (~360px) to confirm one-handed layout
  and zero horizontal overflow.

- **The specific discriminating checks per slice** (each seeds distinct mock accounts — see the
  distinct-email constraint):
  - **02:** signed-out open of a valid token renders pet name only and **zero** diary fields; owner's
    own link routes to their diary; revoked/invalid token → "isn't shared" with no leak; the anonymous
    resolve + `recentOpens` are gone from the seam.
  - **03 (caregiver view):** against a seeded caregiver membership the view renders the read-only set
    and **omits** records + all owner controls (absent from the DOM); a caregiver feed writes an entry
    attributed to the caregiver's name that the owner's history shows; when the diary's link is dead
    the view no longer resolves (shows "access ended").
  - **04 (join):** joining creates exactly one caregiver Membership and lands on `/care/[id]`; a
    second open creates no duplicate; a distinct second helper (distinct email) becomes a *separate*
    Account; revoke removes every caregiver Membership on that diary.
  - **05:** an owner-and-caregiver account shows both sections; a caregiver-only account is **not**
    redirected to create; demo pets are visibly marked; empty account gets a sensible first-run.
  - **06:** code and link resolve the same token; join-by-code works from gate and in-app; "Who has
    access" lists named caregivers with no recent-opens anywhere; revoke kills code + link and unbinds
    all caregivers.

- **No automated test framework is introduced.** The project has no unit-test harness (no ESLint,
  type-check via `tsc`); adding one is out of scope for these UI-first slices. Verification is the
  `tsc` + browser DOM/state pattern above, run per slice before it's marked done.

## Out of Scope

- **Real authentication and database** (Supabase auth + Postgres) and the **AI Gateway** — everything
  stays mocked behind `diary-service`; only the module's insides change when the backend lands.
- **Real cross-device / cross-account data.** The mock is single-browser; "Helping with" uses seeded
  demo pets. True multi-account handover needs the backend.
- **Web-push / reminder delivery.** Reminder **opt-in UI** is in scope (per-diary); actually sending
  notifications is backend work.
- **Per-caregiver removal.** Revoke is whole-link only in the pilot; removing one caregiver while
  keeping others is v2.
- **More than one owned pet per account.** The pilot is one owned pet per account (the infra is
  multi-ready via diaries-by-id + memberships, but no multi-owned-pet UI).
- **A team-facing admin / analytics surface** and any super-admin role — the model is a flat,
  per-diary owner/caregiver split.
- **Introducing an automated test suite / CI.** Not part of these UI-first slices.

## Further Notes

- **Dependency order / frontier:** 01 (done) → 02 → 03 (caregiver view) → 04 (join) → {05, 06}. The
  caregiver **view (03)** is built before the **join (04)**: a join can't be demoed without a screen
  to land on, and the view is verifiable on its own against a seeded caregiver membership. 05 and 06
  both unblock once the join (04) lands and can proceed in parallel; 05 composes the view (03) into
  the home. (This swaps the view/join order from the epic's first draft — recorded in the epic
  README's ordering note.)
- **Governing decisions:** `CONTEXT.md` (App section — Account, Membership, roles, Access, Handover
  link, Referral code; Viewer retired) is the model of record; **ADR-0004** governs access-requires-
  an-account and supersedes the anonymous-viewer part of **ADR-0003** (which is marked partially
  superseded).
- **Slice 01 is the built foundation this spec assumes:** the Account model, name capture at
  `/diary/welcome`, name attribution on feeds, the account menu, and a quota-safe one-time migration
  from the legacy single-diary shape are all in place and verified.
- **The whole epic remains local and uncommitted**, isolated from the live static marketing site, per
  the project's working rules.
