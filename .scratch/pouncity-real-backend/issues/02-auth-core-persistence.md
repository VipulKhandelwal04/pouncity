# 02: Real auth and core persistence (Account + Diary), cross-device

**What to build:** Provision the Supabase project and move identity and the pet's Diary off the browser and into Postgres. Sign-in becomes real (email magic link and Google); the mocked `signIn(email)` and the hardcoded `you@pouncity.app` are gone, and `getAccount()` reads the Supabase session (Access requires an Account, ADR-0004). The Account and the Diary (all core and optional fields) persist server-side with row-level security, so the same person signs in on a second device and sees the same Diary, and a browser wipe does not lose it. This ticket also lays the schema foundation the rest of the backend builds on: it creates the `account`, `diary`, and `membership` tables plus the two Storage buckets, and it establishes the RLS and service-role conventions every later ticket reuses. The full target data model is documented below so the foundation is laid coherently; each table is tagged with the ticket that brings it to life.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A new person signs in with an email magic link and with Google; there is no password step and no mocked identity.
- [ ] The signed-in person's Account and Diary persist in Postgres; signing in on a second device shows the same Diary, and clearing the browser does not lose it.
- [ ] Row-level security scopes reads and writes: an Owner reads and writes only their own Diary, and nobody reads another Owner's Diary.
- [ ] Ownership is enforced through `membership` (role owner), not a column on `diary`; one Owner per Diary is enforced at the database.
- [ ] The Diary photo and rabies certificate live in Storage buckets, with the same field names now holding a path instead of a data URL.
- [ ] `tsc --noEmit` is green; a seam-level test proves a second client for the same Account sees the Diary the first client created.

## Data model

The whole backend's target schema, grounded in the `diary-service.ts` types and respecting ADR-0003 to 0007. Field names are snake_case here and camelCase in the seam, so mapping the async seam bodies onto these tables is mechanical. Every table has row-level security.

**What this ticket creates vs. what it defers.** Ticket 02 provisions the project and creates `auth.users` linkage, `account`, `diary`, `membership`, and the two Storage buckets, plus the RLS pattern and the service-role handover convention. The remaining tables are created by their owning tickets (tagged per table below), but the model is documented here in one place so the foundation is coherent.

| Table | Created in |
|---|---|
| `auth.users` (managed), `account`, `diary`, `membership`, Storage buckets | 02 (this ticket) |
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
