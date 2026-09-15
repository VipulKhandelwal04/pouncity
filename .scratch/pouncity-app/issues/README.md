# Pouncity owner app — UI-first build backlog

Nine screen slices for the signed-in owner app, built **UI-first**: real Next.js/React
app, deployed to Vercel, with **no backend yet**. Later, Supabase (Postgres + magic-link/
Google auth) and Vercel AI Gateway (diet/grooming generation) are integrated *behind the
mock seam* — the screens do not change when that happens.

Derived from `docs/spec-owner-app-ui-tickets-02-08.md`, the two `.docx` specs, ADR-0003
(link-as-access), and `CONTEXT.md`. Vocabulary: **Diary**, **Owner**, **Caregiver**,
**Viewer**, **Handover link**, **Feeding confirm**.

## The one rule that makes "backend later" cheap

Every screen talks to **one** `diary-service` module — never to storage, network, or an
LLM directly. Today that module returns **seeded in-memory data** (persisted to
`localStorage` so a refresh keeps state) and **canned** diet/grooming text. Later, only
the *inside* of that module changes (Supabase queries + AI Gateway calls); the screens are
untouched. The service owns: diary read/write (core + optional fields), diet/grooming
generation requests, the feeding confirm, and the handover-link lifecycle
(create / resolve-public-read / revoke / regenerate) + caregiver binding.

## Register

**Operate mode** (task-first: scannable, calm, consistent — brand in the details, not the
expression). Extends the marketing world (sun/cream/coral/ink, Fredoka + DM Sans, mascots,
dome motifs). Mascots/delight appear at moments (empty states, the tap's confirmation),
not on every screen. Reduced-motion + no-JS-degradation parity with the public site.

## Entry point

The existing static `/sign-in` page's primary action lands the user in the app (Diary
home) instead of dead-ending at "check your inbox." Auth is still mocked in this phase.

## Deferred to the backend phase (no UI-only work here)

- **Ticket 09 — web-push delivery.** Only the reminder *opt-in toggles* appear (folded into
  the tracking + grooming slices). Actual push delivery is backend/runtime.
- **Ticket 10 — analytics instrumentation.** No UI surface; wired when events are real.

## Dependency order

```
01 shell+seam+hub ──┬─ 02 create/edit ── 03 completeness nudge
                    ├─ 04 diet plan
                    ├─ 05 feeding confirm ─────────────┐
                    ├─ 06 grooming guide               │
                    └─ 07 handover view ──┬─ 08 share/admin
                                          └─ 09 caregiver sign-up (also needs 05)
```
