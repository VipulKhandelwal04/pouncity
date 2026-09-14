# Spec — Owner app: UI/UX & control surfaces (tickets 02–08)

> Derived from the Pouncity Pilot Feature Spec + Ticket Breakdown and a design session. Covers the signed-in owner experience once ticket 01 (account + diary creation) exists. No issue tracker is configured yet, so this lives in-repo for manual entry into whatever tracker is set up later; intended triage label when published: `ready-for-agent`.
>
> Uses the `CONTEXT.md` glossary: **Diary** (the single living record per pet), **Caregiver** (owner or sitter with access), **Handover link** (standing read-only share). "Admin" here means the **owner acting as administrator of their own diary** — controlling who can see it and revoking that access (ticket 07). There is **no separate super-admin role** in the pilot (flat caregiver model); a team-facing admin/analytics surface is ticket 10 and out of scope here.

## Problem Statement

Once a pet owner has signed in and created a diary (ticket 01), they need a place to actually *live* in the product: finish the diary at their own pace, get the diet and grooming guidance that drew them in, keep it current with near-zero effort, and — the whole point — hand it to a sitter the moment they need to, then take that access back on their own terms. Today none of that has a home: there is no diary hub, no plan screens, no daily tap, no share/handover surface, and no way for the owner to see or revoke who has access. Without a coherent, calm, mobile-web UI for tickets 02–08, the specced value (trust + zero-effort handover, with diet-AI second) has nowhere to land.

## Solution

A single signed-in **owner app** built in the Pouncity design world but in **Operate mode** (task-first: scannable, consistent, calm — brand in the details, not the expression). It centers on one **Diary** (single pet in the pilot) as a **hub**, with focused detail surfaces hanging off it:

- **Diary home** — the hub: pet header, a non-blocking "complete your diary" nudge, today's one-tap feeding confirm, and cards into Diet, Grooming, and Share.
- **Diet plan** and **Grooming guide** — request-then-view surfaces, each with the standing "general guidance, not vet advice" disclaimer.
- **Tracking** — the daily "fed today" tap, an optional deviation note, and a simple history.
- **Share (the owner's admin surface)** — generate a standing handover link, see who currently has access, and revoke/regenerate.
- **Handover view** — a separate, account-free, read-only rendering of the diary for a recipient, plus an optional path for that recipient to sign up and become an interacting caregiver.

Everything is mobile-web; nothing requires a native app; nothing is gated behind payment.

## User Stories

**App shell & navigation**
1. As an owner, I want to land on my pet's **Diary home** immediately after signing in, so that I see my pet and today's state without hunting.
2. As an owner, I want a persistent, simple way to move between **Diary, Diet, Grooming, and Share**, so that every core task is one tap from anywhere in the app.
3. As an owner, I want the app to remember where I was and load my existing diary on return, so that I never re-enter my pet's information (ties ticket 01).
4. As an owner on my phone's browser, I want the whole app to work without installing anything, so that I can use it immediately.
5. As an owner, I want a clear way to sign out and to see which account I'm in, so that I trust who can reach my pet's data.

**Diary home & completeness nudge (ticket 02)**
6. As an owner, I want my pet's photo, name, species, breed, age and weight shown at the top of Diary home, so that it feels like a real record of *my* pet.
7. As an owner, I want a visible, non-blocking "complete your diary" progress indicator, so that I know what's left without being forced to fill it before using the app.
8. As an owner, I want the nudge to name exactly which pieces are missing (quirks, vet contact, diet plan, grooming guide), so that finishing is obvious and specific.
9. As an owner, I want the completeness indicator to update the moment I add something, so that progress feels responsive and worth doing.
10. As an owner, I want to add and edit free-text **quirks** about my pet, so that any caregiver understands behavior that no structured field captures.
11. As an owner, I want to store my **vet contact** (name, phone, clinic), so that a sitter has emergency info without me relaying it.
12. As an owner, I want to edit any core or optional field later, so that the diary stays the accurate single source of truth as things change.
13. As an owner, I want to dismiss or minimize the nudge once I've done enough, so that a "finished enough" diary doesn't keep nagging me.

**Diet plan (ticket 03)**
14. As an owner, I want a clear "get my diet plan" action, so that I can request guidance the moment I want it.
15. As an owner, I want to be asked for my pet's **current food/brand** (if not already known), so that the plan builds on what I already feed rather than a blank slate.
16. As an owner, I want to see a loading/working state while the plan generates, so that I know it's happening and roughly how long.
17. As an owner, I want the generated plan rendered clearly (what to feed, how much), so that I can act on it without decoding it.
18. As an owner, I want a soft, always-present disclaimer that the plan is general guidance and not veterinary advice, so that I understand its limits before relying on it.
19. As an owner, I want my plan saved to the diary and viewable again later, so that I don't have to regenerate it every time.
20. As an owner, I want to regenerate the plan if my pet's details change, so that guidance stays relevant.
21. As an owner, I want generation to never be blocked by a "diagnosed condition" question, so that the flow stays simple (the disclaimer is the only safeguard, per spec).

**Diet tracking (ticket 04)**
22. As an owner, I want a single, prominent "fed today" button on Diary home, so that logging a meal is one tap and not a chore.
23. As an owner, I want the button to clearly show today's state (fed vs. not yet), so that I know at a glance whether it's done.
24. As an owner, I want tapping again the same day to be harmless (no duplicate entries), so that I never worry about double-logging.
25. As an owner, I want to optionally attach a short note when something deviated (extra treats, skipped meal), so that I can capture reality without being forced to log every detail.
26. As an owner, I want to see a simple history of past confirms and notes, so that I can look back on what actually happened.
27. As an owner, I want a reminder condition to exist for days with no confirm, so that the habit doesn't rely purely on my memory (reminder delivery itself is ticket 09).

**Grooming guide (ticket 05)**
28. As an owner, I want a "get my grooming guide" action, so that I can request grooming guidance when I want it.
29. As an owner, I want to provide my pet's **coat type** (if not already known), so that the guide reflects my actual pet.
30. As an owner, I want the guide shown as breed/coat norms plus a recommended frequency, so that I know the home-care-vs-professional split without researching it.
31. As an owner, I want a recurring grooming reminder set from the guide, so that I don't lose track of when my pet is due (delivery is ticket 09).
32. As an owner, I want the guide saved to the diary and viewable again, so that I can return to it.
33. As an owner, I want the same "general guidance, not vet advice" honesty on grooming, so that expectations are set consistently.

**Handover link & unauthenticated view (ticket 06)**
34. As an owner, I want to generate one shareable link/code for my diary, so that handover is set up once, before I ever need it.
35. As an owner, I want to copy or system-share that link easily, so that getting it to a sitter is frictionless.
36. As an owner, I want the link to stay live indefinitely until I revoke it, so that handover is already done when I'm rushing out the door.
37. As a caregiver receiving a link, I want to open it and see the **full diary read-only with no account**, so that I get feeding, routine, quirks and vet contact as fast as possible.
38. As a caregiver, I want the handover view to be clean and mobile-first, so that I can find what I need one-handed while caring for the pet.
39. As a caregiver, I want it obvious that I'm viewing a shared, read-only diary (not my own account), so that I don't try to change the owner's data.
40. As an owner, I want multiple people to be able to open the same link independently, so that a couple or a family sitter team all get access from one share.

**Handover access management & revocation — the admin surface (ticket 07)**
41. As an owner, I want to see a list of who currently has access to my diary via the link, so that I know exactly who can view it before I decide anything.
42. As an owner, I want to revoke access at any time, so that access ends the moment I decide it should — on my own judgment of "done."
43. As an owner, I want revocation to take effect immediately (the link stops returning diary data), so that I can trust "revoked" means revoked.
44. As an owner, I want to generate a fresh link after revoking, so that I can re-share on my terms without the old link working.
45. As an owner, I want a clear, unambiguous confirmation before revoking, so that I don't cut off a sitter mid-trip by accident.
46. As an owner, I want the access list and its controls to feel like a calm control panel, not a scary security screen, so that managing sharing stays approachable.

**Caregiver sign-up to interact (ticket 08)**
47. As a caregiver viewing via a link, I want the option to sign up (magic link or Google), so that I can actively help rather than only view.
48. As a caregiver, I want signing up to associate my account with *that specific diary*, so that I'm connected to the pet I'm caring for.
49. As a caregiver who has signed up, I want to log a "fed today" confirm myself, so that the owner sees the meal was handled while they're away.
50. As a caregiver, I want to opt into reminders for that diary, so that I don't forget a feeding on the owner's behalf (delivery is ticket 09).
51. As a caregiver, I want my access to still end when the owner revokes the link, so that the owner stays in control even after I've signed up.
52. As a signed-up caregiver, I want it clear that I'm a helper, not the owner (I can log and view, not edit the diary or manage sharing), so that roles are unambiguous.

**Cross-cutting UX**
53. As an owner or caregiver, I want every screen to load fast and degrade gracefully on a flaky mobile connection, so that the app is dependable at the 2am moment it matters.
54. As an owner, I want clear, human error and empty states (no plan yet, generation failed, nothing shared yet), so that I always know what to do next.
55. As an owner, I want the app to feel like Pouncity — warm, calm, unmistakably the same brand as the marketing site — without sacrificing task speed.

## Implementation Decisions

**Information architecture** (confirmed by grilling 2026-09-13)
- **Hub + cards, no tab bar.** The app is organized around a single **Diary** (single pet in the pilot). **Diary home** is the hub, with the **feeding tap as its headline** and status-bearing cards — Diet ("Ready" / "Not generated yet"), Grooming ("Due in N wks"), Share ("Link live · N recent opens") — that each open a focused full-screen detail with a simple back. There is **no persistent bottom tab bar**: with one diary these are *facets*, not parallel sections, and a bar over-weights the occasional (diet/share are touched ~once) against the daily tap. A tab bar is the fallback only if the pilot later grows to multi-pet.
- The app runs in **Operate mode** register: calm, task-first chrome; mascots and delight appear at moments (empty states, the tap's confirmation), not on every screen.
- The **completeness nudge** is a component on Diary home driven by which optional fields are present; it is presentational over diary state, never a blocking gate. First-run / empty states are written to **sell handover** (the wedge), since the daily loop is what makes the diary worth handing off.

**Surfaces (screens/modules)**
- **Diary home**: pet header, completeness nudge, today's feeding-tap control, entry cards to Diet / Grooming / Share, recent-activity glance.
- **Diary edit**: core fields (from ticket 01) + optional **quirks** (free text) and **vet contact** (name/phone/clinic). Edits are independent and can happen any time.
- **Diet plan**: **on-demand only** (the owner taps "get my diet plan" — never auto-generated on diary creation; the hub card reads "Not generated yet — tap to create"). Current food/brand is captured **lazily inside this flow**, not at onboarding (ticket-01 stays at the minimal six fields). Then: working state → rendered plan with a **persistent, non-dismissible** "general guidance, not vet advice" disclaimer; regenerate; saved-plan view.
- **Grooming guide**: same shape — **on-demand**, **coat type captured lazily in-flow**; working state → guide (norms + frequency) + recurring reminder scheduling; the same persistent disclaimer; saved-guide view.
- **Tracking**: the **Feeding confirm** — one per diary per day (idempotent), **reversible the same day** (a mistap can be toggled off; still one confirm/day), an optional deviation note via a secondary "add a note," and a reverse-chronological history. The confirm is **attributed** ("Fed today · by Sam") so the Owner sees when a Caregiver handled it; the first person to confirm wins the day and a second sees it's already done.
- **Share (owner admin)**: generate/copy/share the standing handover link; the **access list** (who currently has access); **revoke** (with confirmation) and **regenerate**.
- **Handover view (public, account-free)**: a separate read-only rendering of the full diary keyed by a public read token; visibly a shared, read-only context; includes an inline "sign up to help" entry to ticket 08.
- **Caregiver onboarding**: sign-up (reusing the passwordless `/sign-in` mechanism — magic link or Google) that binds the new account to the specific diary as a **caregiver**, unlocking logging + reminder opt-in but not editing or share management.

**Roles, access & the admin surface (link-as-access — see ADR-0003)**
- Three roles by capability: **Owner** (created the diary; edit + generate + manage/revoke sharing — the "admin" of their own diary), **Caregiver** (a Viewer who signed up and is bound to the diary; can log the feeding confirm + opt into reminders, cannot edit or share), and **Viewer** (opens the Handover link with no account; read-only; not individually identified). "Flat" = no field-level redaction (everyone with access sees every field), **not** equal capabilities.
- **Access = the standing Handover link** (link-as-access, ADR-0003). "Who has access" resolves to *the link is live (N recent opens)* + *these named Caregivers*; anonymous Viewers are counted, never named. The Share (admin) screen shows: the link (copy / system-share), a recent-opens count, the named Caregivers list (informational), **Revoke** (whole-link only — a confirmed, destructive-feeling action: "ends access for everyone; share a new link after"), and **Regenerate**. Per-caregiver removal is out (v2). A revoked link shows recipients a plain "this diary is no longer shared."

**Handover link lifecycle**
- Owner-generated, standing (non-expiring) link/code per diary. Opening it grants immediate **read** to the full diary with no account. Revocation is manual, owner-only, and immediate — a revoked link returns no diary data. Regeneration issues a new token; the old one stays dead. Interacting (logging/reminders) requires the recipient to create an account bound to that diary (ticket 08); that caregiver's access is still bound by the owner's revocation.

**Seam / contracts (see Testing Decisions)**
- All of the above is UI over a **single service/API layer** that owns: diary read/write (core + optional fields), diet/grooming generation requests, tracking confirms, and the handover-link lifecycle (create / resolve-public-read / revoke / regenerate). The unauthenticated handover view is the same API via a public read token. The diet/grooming LLM call is treated as a **contract boundary** behind that API: given fixed inputs it returns a well-formed plan/guide object, always rendered with the disclaimer — the UI never asserts on AI content correctness.

**Design language**
- Extends the Pouncity marketing world (sun/cream/coral/ink, Fredoka + DM Sans, mascots, dome motifs) into **Operate mode**: prioritize scanability, consistency, native mobile expectations and the real one-handed usage scene; brand shows in precise details (the tap's delight, mascots at empty states), not marketing flourish. Reduced-motion and no-JS-degradation parity with the public site.

## Testing Decisions

- **Test external behavior, not implementation.** e.g. "a revoked link returns no diary data" and "a second 'fed today' the same day does not create a duplicate," never "the revoke function sets a flag."
- **One seam, reused:** the service/API layer described above is the primary test seam for all of tickets 02–08 (diary CRUD incl. optional fields; plan/guide generation requests; idempotent daily confirm; handover create/public-read/revoke/regenerate; caregiver association). Prefer this single high seam over per-screen backend seams.
- **Modules under test:** Diary (core + optional fields independently addable; always exactly one owner), Diet/Grooming generation (given fixed inputs a well-formed object returns and renders *with* the disclaimer — do not assert AI content), Tracking (idempotent per-day confirm, optional note attaches, reminder condition true only when no confirm exists), Handover (link produces a working unauthenticated read; revoke immediately invalidates; caregiver interaction requires an account bound to that diary and is still subject to revocation).
- **UI/interaction tests** sit at the component level against the API mocked at its boundary: completeness nudge reflects diary state; feeding tap reflects today's state and is idempotent on repeat tap; disclaimer is always present on any rendered plan/guide; revoke requires explicit confirmation; the handover view is read-only (exposes no owner-only controls).
- **Prior art:** none in-repo yet (pre-build). The existing Feature Spec's "Testing Decisions" section is the reference contract for the seam and the behavior-not-implementation stance.

## Out of Scope

- **Ticket 01** itself (account + diary creation) and **ticket 09** (web-push *delivery* — this spec only establishes the reminder *conditions/opt-ins* those pushes consume) and **ticket 10** (team-facing analytics/admin dashboard).
- Multi-pet households (one diary per owner in the pilot).
- Tiered or field-level caregiver permissions / redacted sharing (flat role only).
- Auto-expiring handover links (revocation is manual-only).
- Structured/quantity-based food logging (the daily confirm is binary + optional note).
- Payment, subscriptions, pricing surfaces (pilot is free).
- Native app; grooming appointment booking / professional marketplace.
- Any formal "vet-backed" claim or hard guardrail for diagnosed conditions (soft disclaimer only).

## Further Notes

- **Admin, clarified:** the sharpest "admin" surface in 2–8 is **ticket 07** (access list + revocation). It should read as a calm, legible control panel — the owner's sense of *"done"* is the security model, so revocation must be obvious, confirmed, and instantly trustworthy.
- **Wedge order:** the spec treats **trust + zero-effort handover** as the primary wedge and diet-AI as second. UI priority should follow: the feeding tap and the Share/handover surfaces deserve the most polish and the shortest paths; plan/grooming generation is core but secondary.
- **Reuse `/sign-in`:** caregiver sign-up (ticket 08) should reuse the already-built passwordless `/sign-in` (magic link + Google) rather than a new auth surface, binding the resulting account to the diary.
- **Honesty guardrail:** both diet and grooming are LLM-over-public-literature with no vet review; the disclaimer is load-bearing and must be present on every rendered plan/guide — never a dismissible one-time modal.
- Not published to a tracker (none configured). Run `/setup-matt-pocock-skills` to enable tracker publishing + triage labels, then this becomes a `ready-for-agent` issue.
