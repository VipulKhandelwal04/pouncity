# Pouncity real backend build backlog

Eleven tickets that replace the mock, browser-only data layer with a real backend, behind
the screens and flows that already exist. No screen, flow, or copy changes; this is a
backend swap behind the existing UI. Derived from `docs/spec-real-backend.md`
(`ready-for-agent`), the `diary-service.ts` types, `CONTEXT.md`, and ADR-0003 to 0007.

> This document consolidates the eleven ticket files that lived under
> `.scratch/pouncity-real-backend/issues/` (a local, git-ignored backlog) into one
> tracked reference inside the V2 app. The full data model that used to live in the
> ticket-02 file is included in the **Data model** section at the end.

Vocabulary: **Account**, **Diary**, **Membership**, **Owner**, **Caregiver**, **Access**,
**Handover link**, **Referral code**, **Feeding confirm**, **Circle**, **Past Caregiver**,
**Rating**.

## The one rule that makes "backend later" cheap

Every screen talks to **one** `diary-service` module. Ticket 01 turns that seam async
(expand-contract, since its blast radius fans across every call site); after that, each
later ticket swaps a seam body from localStorage to Supabase or the AI Gateway, and the
screens are untouched. Two small dedicated seams are added: the reminder scheduler
(ticket 10) and `lib/analytics.ts` `track` (ticket 11).

## The data model lives in the Data model section

The full 13-table Supabase schema (plus the managed `auth.users` and two Storage buckets)
is documented in the **[Data model](#data-model)** section at the end of this file, tagged
per table with the ticket that creates it. Ticket 02 creates the foundation (`account`,
`diary`, `membership`, the buckets, and the RLS + service-role conventions); later tickets
add their own tables. The same schema is also a shareable page:
https://claude.ai/code/artifact/7e258f30-4138-48c8-91af-8d8bd0bd449e

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

---

## 01: Make the diary-service seam async (prefactor)

**What to build:** Convert every exported function on the `diary-service` seam to return a Promise, and update every call site to await it, while the seam stays localStorage-backed. The app behaves identically for the user; this is a mechanical prefactor so the later backend swaps are a clean body change with no call-site churn. This is the one wide refactor in the set (its blast radius fans across every screen that reads or writes the seam), so run it expand-contract, per the spec: add the async form beside the sync one, migrate the call sites in batches, then remove the sync form once nothing calls it. "Make the change easy, then make the easy change."

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Every exported `diary-service` function returns a Promise; no synchronous seam call remains anywhere in the app.
- [ ] Every existing flow (create and edit Diary, Feeding confirm, diet and grooming, handover create/resolve/revoke, caregiver binding) behaves exactly as before.
- [ ] The single-seam rule still holds: no screen reads storage, network, or an LLM directly.
- [ ] The seam is still localStorage-backed at the end of this ticket (no Supabase yet). This is purely the sync to async shape change.
- [ ] `tsc --noEmit` is green.

---

## 02: Real auth and core persistence (Account + Diary), cross-device

**What to build:** Provision the Supabase project and move identity and the pet's Diary off the browser and into Postgres. Sign-in becomes real (email magic link and Google); the mocked `signIn(email)` and the hardcoded `you@pouncity.app` are gone, and `getAccount()` reads the Supabase session (Access requires an Account, ADR-0004). The Account and the Diary (all core and optional fields) persist server-side with row-level security, so the same person signs in on a second device and sees the same Diary, and a browser wipe does not lose it. This ticket also lays the schema foundation the rest of the backend builds on: it creates the `account`, `diary`, and `membership` tables plus the two Storage buckets, and it establishes the RLS and service-role conventions every later ticket reuses. The full target data model is documented in the [Data model](#data-model) section below so the foundation is laid coherently; each table is tagged with the ticket that brings it to life.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A new person signs in with an email magic link and with Google; there is no password step and no mocked identity.
- [ ] The signed-in person's Account and Diary persist in Postgres; signing in on a second device shows the same Diary, and clearing the browser does not lose it.
- [ ] Row-level security scopes reads and writes: an Owner reads and writes only their own Diary, and nobody reads another Owner's Diary.
- [ ] Ownership is enforced through `membership` (role owner), not a column on `diary`; one Owner per Diary is enforced at the database.
- [ ] The Diary photo and rabies certificate live in Storage buckets, with the same field names now holding a path instead of a data URL.
- [ ] `tsc --noEmit` is green; a seam-level test proves a second client for the same Account sees the Diary the first client created.

> The full schema this ticket founds — and every later ticket extends — is in the [Data model](#data-model) section at the end of this document.

---

## 03: Feeding confirms and history, cross-device

**What to build:** Feeding confirms move server-side into `feeding_entry`. A confirm is idempotent per Diary per day (tapping twice does not double-log), records who confirmed and an optional deviation note, and the full history reads back across devices, so a confirm made on one device shows on another. Creates the `feeding_entry` table (defined in ticket 02's data model) and swaps the seam's feeding body from localStorage to Postgres.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A Feeding confirm persists server-side and is visible on a second device.
- [ ] Confirming twice on the same day is idempotent (one entry per Diary per day), preserving the existing per-day behavior.
- [ ] Each entry records who confirmed and an optional deviation note; history reads back in date order.
- [ ] `tsc --noEmit` is green; a seam-level test proves a confirm on one client appears on another.

---

## 04: Public Handover endpoint (unauthenticated cross-device read)

**What to build:** A public server route resolves a Diary read-only by Handover token, with no account and no session, so a sitter opens the link on their own phone and sees the Diary. This is the one capability that could not exist client-side. Generating the link persists a `handover_token`; opening it records a `handover_open` and returns a read-only Diary subset. The route runs with the service role and enforces `state='active'` itself (ADR-0003 link-as-access), the single path that skips RLS. Creates `handover_token` and `handover_open` (defined in ticket 02's data model).

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Sharing a pet persists an active `handover_token` (link plus short referral code); one active link per pet.
- [ ] A person with no account opens the token on their own device and sees the Diary read-only.
- [ ] The public route serves only an active token and never exposes a signed-in-only field; it runs server-side with the service role, not client RLS.
- [ ] Each open is recorded, so the access list and the opened event in later tickets have data.
- [ ] `tsc --noEmit` is green; a test in a separate storage context (a real second device) reads the Diary by token with no session.

---

## 05: Handover access list, server-enforced revocation, Past Caregiver (and private Rating)

**What to build:** The Owner sees who currently has Access via the link, and can revoke it so Access stops immediately on every device (the server flips the token state, not the browser). On revoke, each person whose access ended is retained as a private Past Caregiver (ADR-0006), readable only by the Owner and granting no access, and a fresh link can be generated to re-share. This ticket also persists the Owner's private Rating of a Caregiver (user story 8), written when a handover ends, visible only to the Owner and never aggregated (ADR-0005). Creates `past_caregiver` and `rating` (defined in ticket 02's data model).

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] The Owner sees who currently has Access (from the recorded opens).
- [ ] Revoke flips the token state server-side; the public route returns nothing immediately on every device.
- [ ] Each person whose access ended is retained as a private Past Caregiver, readable only by the Owner, with no access to the Diary.
- [ ] The Owner can generate a fresh link after revoke.
- [ ] The Owner's private Rating of a Caregiver persists server-side, Owner-only, and survives revoke and re-share.
- [ ] `tsc --noEmit` is green; tests prove revoke stops a second device's read, the Past Caregiver is retained without access, and a Rating is readable only by its Owner.

> Note: `rating` had no dedicated ticket in the presented breakdown. User story 8 ("my Ratings stored privately server-side") puts it in scope, and it is written at the revoke moment and scoped Owner-only alongside Past Caregiver, so it is folded here. Split it into its own ticket if you would rather.

---

## 06: Caregiver sign-up bound to a Diary

**What to build:** A sitter viewing via the link signs up and is bound as the single Caregiver for that specific Diary (ADR-0004 access requires an Account, ADR-0007 one Caregiver per pet). As a Caregiver they can log a Feeding confirm and opt into reminders, but gain no Owner rights, and their Access ends the moment the Owner revokes.

**Blocked by:** 04, 03.

**Status:** ready-for-agent

- [ ] A sitter signs up from the link and is bound as the one Caregiver for that Diary; a second would-be Caregiver is refused at the database (ADR-0007).
- [ ] The Caregiver can log a Feeding confirm and opt into reminders; they cannot edit ownership-level things.
- [ ] When the Owner revokes, the Caregiver's Access ends immediately.
- [ ] `tsc --noEmit` is green; a test proves the one-Caregiver-per-pet constraint and the loss of access on revoke.

---

## 07: AI diet plan via AI Gateway (server-side, with guardrail)

**What to build:** `requestDietPlan` calls the AI Gateway from the server (keys never reach the client), applies the diet safety guardrail (vet-constrained, never a prescription diet) before returning, and saves the result to the Diary with the disclaimer shown on screen. The existing templated generator and the manual save path stay as fallback, so the screen is never blocked by a gateway outage. This ticket settles the disclaimer-versus-constraint decision the spec flagged: choose the guardrail model (disclaimer only, or an actual constraint layer) before wiring the gateway. Creates the `diet_plan` table (defined in ticket 02's data model).

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A diet plan is generated server-side from the pet's breed, age, weight, and current food, and saved to the Diary.
- [ ] The safety guardrail is applied before returning; an unsafe or prescription-style suggestion is constrained or rejected.
- [ ] If the gateway is unavailable, the templated or manual path still saves a plan; the screen never hard-depends on the model.
- [ ] The plan records its source (ai, templated, or manual); the disclaimer shows on screen.
- [ ] `tsc --noEmit` is green; tests with a stubbed gateway prove the guardrail constrains an unsafe suggestion and the fallback still saves.

---

## 08: AI grooming guide via AI Gateway

**What to build:** The same server-side pattern as the diet plan, reusing the gateway wiring from ticket 07. `requestGroomingGuide` generates from the pet's breed and coat type, returns a recommended frequency (which later drives grooming reminders), saves to the Diary, and keeps the templated and manual paths as fallback. Creates the `grooming_guide` table (defined in ticket 02's data model).

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] A grooming guide is generated server-side from breed and coat type, with a recommended frequency, and saved to the Diary.
- [ ] The templated or manual path still saves a guide when the gateway is unavailable.
- [ ] The guide records its source; the recommended frequency is stored for the reminder schedule.
- [ ] `tsc --noEmit` is green; tests mirror ticket 07 with a stubbed gateway.

---

## 09: Web push subscription and service worker (opt-in)

**What to build:** Opting in registers a service worker and a VAPID Web Push subscription for the current device, stored per person, and the reminder preference (feeding, grooming) persists per person per Diary. Declining leaves the app fully usable (the no-guilt hard rail); reminders are never a wall. Creates the `push_subscription` and `reminder_pref` tables (defined in ticket 02's data model). This ticket sets up subscription and opt-in only; actual delivery is ticket 10.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Opting in registers a service worker and stores a push subscription for the device.
- [ ] The reminder opt-in preference (feeding, grooming) persists per person per Diary.
- [ ] Declining notifications leaves every feature fully usable; nothing is gated behind push.
- [ ] `tsc --noEmit` is green; a test proves a stored subscription round-trips and that declining blocks nothing.

---

## 10: Reminder scheduler and delivery

**What to build:** A scheduled server job (cron) evaluates, for each Diary with reminders on, whether a Feeding confirm exists for the day and sends a feeding reminder if not, and sends a grooming reminder on the guide's frequency. The evaluation is a pure, testable function separate from delivery; the scheduler reads prefs and subscriptions via the service role, and expired push endpoints are cleaned up on send failure.

**Blocked by:** 09, 03, 08.

**Status:** ready-for-agent

- [ ] With reminders on and no confirm logged for the day, the evaluation yields a feeding reminder; with a confirm, it yields none.
- [ ] A grooming reminder is sent on the guide's frequency.
- [ ] The scheduler reads prefs and subscriptions via the service role; a failed endpoint is removed.
- [ ] `tsc --noEmit` is green; the pure evaluation function is tested directly, separate from actual push delivery.

---

## 11: Pilot analytics, five events, belief report

**What to build:** A thin `lib/analytics.ts` `track(event, props)` boundary emits the five pilot events (diet plan generated, diet plan viewed, daily Feeding tap, Handover link created, Handover link opened by recipient) to an event store, each tagged with the belief statement it tests, plus a viewable report mapping each event to one of the four belief statements. The daily tap dedupes once per Diary per day; the open dedupes per unique recipient. Kept out of `diary-service` because it is cross-cutting. Creates the `analytics_event` table (defined in ticket 02's data model).

**Blocked by:** 03, 04, 07.

**Status:** ready-for-agent

- [ ] Each of the five events fires per its rule; the daily tap logs once per Diary per day, the open once per unique recipient.
- [ ] Each event is tagged with the belief statement it tests.
- [ ] A report maps each event to one of the four belief statements and is viewable by the team.
- [ ] Analytics is a separate seam (`track`), not inside `diary-service`; `tsc --noEmit` is green; the `track` boundary is tested, not the vendor.

---

## Data model

The whole backend's target schema, grounded in the `diary-service.ts` types and respecting ADR-0003 to 0007. Field names are snake_case here and camelCase in the seam, so mapping the async seam bodies onto these tables is mechanical. Every table has row-level security.

**What ticket 02 creates vs. what it defers.** Ticket 02 provisions the project and creates `auth.users` linkage, `account`, `diary`, `membership`, and the two Storage buckets, plus the RLS pattern and the service-role handover convention. The remaining tables are created by their owning tickets (tagged per table below), but the model is documented here in one place so the foundation is coherent.

| Table | Created in |
|---|---|
| `auth.users` (managed), `account`, `diary`, `membership`, Storage buckets | 02 |
| `feeding_entry` | 03 |
| `handover_token`, `handover_open` | 04 |
| `past_caregiver`, `rating` | 05 |
| `diet_plan` | 07 |
| `grooming_guide` | 08 |
| `reminder_pref`, `push_subscription` | 09 |
| `analytics_event` | 11 |

### Identity and pet

**`auth.users`** (Supabase-managed): created and owned by Supabase Auth, not by us. Holds the email and the sign-in provider (magic link, Google). Everything below keys off `auth.users.id`. We never write it directly.

**`account`**: a person using the app (the identity behind Sign-in). One row per auth user. *Created in 02.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | = `auth.users.id` (FK, on delete cascade) |
| name | text | display name; `''` until captured on the welcome step |
| email | text | mirror of the auth email, for display and reattach |
| created_at | timestamptz | default `now()` |

Rules: PK `id`. RLS: a person reads and writes only their own row.

**`diary`**: the pet's one living record. Embedded plans, feeding log, and handover live in their own tables. *Created in 02.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| name | text | not null |
| species | text | check `'dog', 'cat'` |
| breed | text | default `''` |
| age_label | text | free text, e.g. "3 years", "8 months" |
| weight_kg | numeric | nullable |
| photo_url | text | nullable; path in the `pet-photos` bucket |
| quirks | text | nullable free-text notes |
| vet_name | text | nullable |
| vet_phone | text | nullable |
| vet_clinic | text | nullable (the VetContact trio) |
| neuter_status | text | check `'neutered', 'spayed', 'none'`, default `'none'` |
| registered | boolean | default `false` |
| rabies_vaccinated | boolean | default `false`; the "vaccinated?" flag |
| rabies_certificate_url | text | nullable; path in `rabies-certificates` bucket |
| rabies_expiry | date | nullable |
| current_food | text | nullable |
| coat_type | text | nullable |
| created_at | timestamptz | default `now()` |

Rules: PK `id`. RLS via `membership`: the Owner reads and writes, a bound Caregiver reads. The public handover route reads a read-only subset by token.

### Sharing and Circle

**`membership`**: binds an Account to a Diary with a role. Roles are per-Diary, never global. ADR-0004, 0007. *Created in 02.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| account_id (FK) | uuid | to account(id) |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| role | text | check `'owner', 'caregiver'` |
| created_at | timestamptz | default `now()` |

Rules: unique `(account_id, diary_id)`; partial unique `(diary_id) where role='caregiver'` (one Caregiver per pet, ADR-0007) and `where role='owner'` (one Owner). Ownership lives here, not as a column on `diary`.

**`handover_token`**: the Handover link and its short Referral code. A valid active row is the access itself. ADR-0003. *Created in 04.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| token | text | unique; the opaque link token |
| referral_code | text | unique; short human code read out loud |
| state | text | check `'active', 'revoked'`, default `'active'` |
| created_at | timestamptz | default `now()` |
| revoked_at | timestamptz | nullable |

Rules: partial unique `(diary_id) where state='active'` (one live link per pet). Read publicly only through the server route (service role) that checks `state='active'`; revoking flips the state and access stops everywhere at once.

**`handover_open`**: each time the link is opened. Powers the "who has access" list and the "opened by recipient" event. *Created in 04.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| token_id (FK) | uuid | to handover_token(id) on delete cascade |
| opened_by_account_id (FK) | uuid | nullable; null = an anonymous sitter |
| recipient_key | text | anonymous fingerprint, to count unique recipients |
| opened_at | timestamptz | default `now()` |

Rules: RLS: the Diary's Owner reads. Written by the public route on each open.

**`past_caregiver`**: a former Caregiver kept privately after revoke. History, not live access. ADR-0006. *Created in 05.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| account_id (FK) | uuid | to account(id) |
| ended_at | timestamptz | when the Owner revoked the binding link |
| created_at | timestamptz | default `now()` |

Rules: unique `(diary_id, account_id)`. RLS: only the Owner reads. Grants no access to the Diary.

**`rating`**: private feedback an Owner keeps on a Caregiver. Never shown to the Caregiver, never aggregated. ADR-0005. *Created in 05.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| owner_account_id (FK) | uuid | to account(id) |
| caregiver_account_id (FK) | uuid | to account(id) |
| diary_id (FK) | uuid | to diary(id) |
| stars | int | check `between 1 and 5` |
| note | text | nullable |
| updated_at | timestamptz | default `now()` |

Rules: unique `(owner_account_id, caregiver_account_id, diary_id)`. RLS: only the Owner who wrote it reads or writes it. Survives revoke and re-share.

### Care logging

**`feeding_entry`**: one Feeding confirm per Diary per day, with an optional deviation note. *Created in 03.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| fed_on | date | the yyyy-mm-dd day |
| by_account_id (FK) | uuid | to account(id); who confirmed |
| by_name | text | attribution snapshot at confirm time |
| note | text | nullable deviation note |
| created_at | timestamptz | default `now()` |

Rules: unique `(diary_id, fed_on)` makes the tap idempotent per day. RLS: Owner and bound Caregiver read and write.

### AI generation

**`diet_plan`**: a generated (or hand-written) diet plan saved to a Diary. Latest row is the current plan. *Created in 07.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| current_food | text | |
| summary | text | |
| portion_per_day | text | |
| meals | text | |
| tips | text[] | list of tips |
| source | text | check `'ai', 'templated', 'manual'` |
| created_at | timestamptz | default `now()`; latest = current |

Rules: RLS: Owner and bound Caregiver read; the Owner or the generate action writes. The disclaimer is copy on the screen, not a stored field.

**`grooming_guide`**: a generated (or hand-written) grooming guide with a recommended frequency. *Created in 08.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| coat_type | text | |
| frequency_weeks | int | recommended cadence, drives grooming reminders |
| summary | text | |
| routine | text[] | list of steps |
| professional | text | the professional-groom line |
| source | text | check `'ai', 'templated', 'manual'` |
| created_at | timestamptz | default `now()` |

Rules: RLS: Owner and bound Caregiver read; Owner or generate action writes.

### Reminders

**`reminder_pref`**: per person, per Diary: whether feeding and grooming reminders are on. *Created in 09.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| account_id (FK) | uuid | to account(id) |
| diary_id (FK) | uuid | to diary(id) on delete cascade |
| feeding_enabled | boolean | default `false` |
| grooming_enabled | boolean | default `false` |
| updated_at | timestamptz | default `now()` |

Rules: unique `(account_id, diary_id)`. RLS: the person owns their own prefs. The scheduler reads via the service role.

**`push_subscription`**: a Web Push endpoint for one browser or device the person opted in on. *Created in 09.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | uuid | default `gen_random_uuid()` |
| account_id (FK) | uuid | to account(id) on delete cascade |
| endpoint | text | unique; the push service URL |
| p256dh | text | subscription key |
| auth | text | subscription auth secret |
| user_agent | text | nullable; to label the device |
| created_at | timestamptz | default `now()` |

Rules: RLS: the person owns their subscriptions. The scheduler reads them via the service role to send; expired endpoints are deleted on failure.

### Analytics

**`analytics_event`**: the five pilot events, each tagged with the belief statement it tests. *Created in 11.*

| Field | Type | Notes |
|---|---|---|
| id (PK) | bigint | identity |
| name | text | `diet_plan_generated`, `diet_plan_viewed`, `daily_feeding_tap`, `handover_created`, `handover_opened` |
| belief | text | which of the four pilot belief statements |
| account_id (FK) | uuid | nullable |
| diary_id (FK) | uuid | nullable |
| recipient_key | text | nullable; dedupes `handover_opened` per unique recipient |
| props | jsonb | nullable; any extra event detail |
| occurred_at | timestamptz | default `now()` |

Rules: dedup via partial unique indexes: `(name, diary_id, occurred_at::date)` for the daily tap, and `(name, recipient_key)` per token for opens. Insert-only from the app; the team reads through a restricted report role.

### Storage buckets (2)

`pet-photos` holds the Diary photo (`diary.photo_url`) and `rabies-certificates` holds the vaccination proof (`diary.rabies_certificate_url`). Both replace the current image-data-URL fields with real object storage, same field names now holding a path. Access is scoped the same way as the parent Diary. *Created in 02.*

### Design decisions worth knowing

- **Ownership lives in `membership`, not a column on `diary`.** Roles stay per-Diary per the glossary; one Owner and one Caregiver are enforced by partial unique indexes (ADR-0007). If you would rather have a fast `diary.owner_id`, it is a safe denormalization, but keep `membership` as the source of truth for access.
- **Plans and guides are their own tables, keyed by `diary_id`, latest-wins.** This keeps history and makes the "plan generated / viewed" events clean. If you never want history, fold each into a `jsonb` column on `diary` instead.
- **The handover read is the one path that skips RLS.** A sitter has no session, so the public route runs with the service role and enforces `state='active'` itself (ADR-0003 link-as-access). Everything else is client RLS. Interacting still requires an account (ADR-0004).
- **Every table has row-level security** scoping rows to the signed-in Account and their Circle. The `rating` and `past_caregiver` tables are Owner-only and never visible to the Caregiver they describe (ADR-0005).
- **Field names mirror `diary-service.ts`** (snake_case here, camelCase there), so mapping the seam's async bodies onto these tables is mechanical.
