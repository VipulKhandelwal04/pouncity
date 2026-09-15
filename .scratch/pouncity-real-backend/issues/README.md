# Pouncity real backend build backlog

Eleven tickets that replace the mock, browser-only data layer with a real backend, behind
the screens and flows that already exist. No screen, flow, or copy changes; this is a
backend swap behind the existing UI. Derived from `docs/spec-real-backend.md`
(`ready-for-agent`), the `diary-service.ts` types, `CONTEXT.md`, and ADR-0003 to 0007.

Vocabulary: **Account**, **Diary**, **Membership**, **Owner**, **Caregiver**, **Access**,
**Handover link**, **Referral code**, **Feeding confirm**, **Circle**, **Past Caregiver**,
**Rating**.

## The one rule that makes "backend later" cheap

Every screen talks to **one** `diary-service` module. Ticket 01 turns that seam async
(expand-contract, since its blast radius fans across every call site); after that, each
later ticket swaps a seam body from localStorage to Supabase or the AI Gateway, and the
screens are untouched. Two small dedicated seams are added: the reminder scheduler
(ticket 10) and `lib/analytics.ts` `track` (ticket 11).

## The data model lives in ticket 02

The full 13-table Supabase schema (plus the managed `auth.users` and two Storage buckets)
is documented in **`02-auth-core-persistence.md`**, tagged per table with the ticket that
creates it. Ticket 02 creates the foundation (`account`, `diary`, `membership`, the
buckets, and the RLS + service-role conventions); later tickets add their own tables. The
same schema is also a shareable page: https://claude.ai/code/artifact/7e258f30-4138-48c8-91af-8d8bd0bd449e

## Sequencing (critical path first)

Per the spec: (1) auth + data + cross-device Handover, which alone makes the app genuinely
multi-device and real; (2) AI generation; (3) push and scheduler; (4) analytics.

```
01 async seam prefactor
   └─ 02 auth + core persistence (Account + Diary)   <- full data model lives here
        ├─ 03 feeding confirms
        ├─ 04 public handover endpoint
        │    ├─ 05 access list + revoke + Past Caregiver + Rating
        │    └─ 06 caregiver sign-up (also needs 03)
        ├─ 07 AI diet plan ── 08 AI grooming guide
        ├─ 09 web push opt-in ── 10 reminder scheduler (also needs 03, 08)
        └─ 11 pilot analytics (also needs 04, 07)
```

## Blocking edges

| Ticket | Blocked by |
|---|---|
| 01 async seam prefactor | none |
| 02 auth + core persistence | 01 |
| 03 feeding confirms | 02 |
| 04 public handover endpoint | 02 |
| 05 access list + revoke + Past Caregiver + Rating | 04 |
| 06 caregiver sign-up | 04, 03 |
| 07 AI diet plan | 02 |
| 08 AI grooming guide | 07 |
| 09 web push opt-in | 02 |
| 10 reminder scheduler | 09, 03, 08 |
| 11 pilot analytics | 03, 04, 07 |

## Decisions kept from the breakdown (adjustable)

- **Ticket 02 stays one ticket** (provision + auth + Account + Diary). It could split auth
  from Diary persistence if you want smaller slices.
- **AI diet (07) and grooming (08) stay separate**, 08 reusing 07's gateway wiring. They
  could merge into one.
- **Ticket 04 (handover endpoint) depends only on 02**, so feeding history (03) fills in
  once it lands rather than gating the handover work.
- **Rating folds into ticket 05** (written at the revoke moment, Owner-only, no dedicated
  ticket in the breakdown). It could be its own ticket.
