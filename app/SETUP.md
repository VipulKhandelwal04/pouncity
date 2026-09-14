# Setup

Status: Tickets 01–09 code complete and live-verified against a real
Supabase project. This file was written for Ticket 01 and has setup notes
for later tickets appended rather than being fully rewritten each time —
see the bottom section for Ticket 09 (push notifications).

## 1. Supabase project

Uses an existing Supabase project (shared with other, unrelated tables —
that's fine, `passports` is fully namespaced and RLS-scoped to its own
rows). Credentials live in `.env.local` (gitignored, not committed):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.local.example` to `.env.local` and fill in your project's URL
and anon public key from **Project Settings → API**.

**On `service_role`**: as of Ticket 09, there is exactly one deliberate,
scoped exception to "never use `service_role`" — the cron-triggered
reminder sweep at `/api/cron/send-reminders`, which needs cross-user
reads that RLS is specifically designed to block from a normal session.
It's isolated to `src/lib/supabase/service-role-client.ts` (guarded by
`server-only`) and that one route. Every other part of the app still goes
through the anon key + the signed-in user's own session — do not reach
for `service_role` anywhere else without the same level of justification.

## 2. Database migrations — already applied

Both files in `supabase/migrations/` have been run against the live
project via the Supabase SQL Editor:

1. `0001_passports.sql` — `passports` table, RLS policies scoped to
   `auth.uid() = owner_id`.
2. `0002_passport_photos_bucket.sql` — public `passport-photos` bucket,
   5 MB / image-only limits, upload policy scoped to the caller's own
   `{user_id}/` folder.

Re-applying `0001` is idempotent (`create table if not exists`). Re-running
`0002`'s `create policy` statements will error if already applied — that's
expected, not a problem (the bucket insert itself is idempotent via
`on conflict`).

## 3. Auth providers — already configured

- **Magic link (email OTP)** — enabled by default, live-verified: a real
  email round-tripped through `/auth/v1/otp` and arrived in the inbox.
- **Google OAuth** — configured in Google Cloud Console (OAuth client,
  redirect URI set to `https://<project-ref>.supabase.co/auth/v1/callback`)
  and enabled in Supabase **Authentication → Sign In / Providers → Google**.
  Live-verified: `/auth/v1/authorize?provider=google` correctly redirects
  to Google's real consent screen with the right `client_id` and
  `redirect_uri`.

## 4. Run it

```bash
npm install
npm run dev
```

Visit `/login`, sign in via magic link or Google, land on `/passport/new`
to create a passport, then `/passport` to view it.

## Verified

- `npm run typecheck` — passes
- `npm run lint` — passes
- `npm test` — 11/11 passing (passport domain logic, in-memory repository,
  no live dependency)
- `npm run build` — passes
- Live: `passports` table + RLS, `passport-photos` bucket + policies,
  magic-link email delivery, Google OAuth redirect chain

## Not yet verified

- The actual in-browser click-through (sign in → land on `/passport/new`
  → upload a photo → see the created passport) hasn't been run manually
  yet — everything underneath it has been verified piece by piece at the
  protocol level instead.

## Ticket 09 — Web push notifications

Needs three more env vars beyond the Ticket 01 pair, all in
`.env.local.example`:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with
  `npx web-push generate-vapid-keys`. The public key is safe to expose to
  the client (it's sent to `pushManager.subscribe()`); the private key is
  server-only.
- `VAPID_SUBJECT` — a `mailto:` (or `https:`) contact URL, required by
  the web push protocol so a push service can reach the app owner if
  there's abuse. Currently set to the account owner's personal email as a
  placeholder — swap for a dedicated support/contact address before
  relying on this beyond the pilot.
- `SUPABASE_SERVICE_ROLE_KEY` — from **Project Settings → API →
  service_role**. Used only by `/api/cron/send-reminders` (see the
  `service_role` note above).
- `CRON_SECRET` — a random shared secret the cron route checks via a
  `Bearer` header. Generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

**The reminder-sending schedule is not wired up.** The sweep logic
(`runReminderSweep`) and the route that exposes it exist and are
live-testable by hand (`curl -X POST .../api/cron/send-reminders -H
"Authorization: Bearer $CRON_SECRET"`), but nothing calls it
automatically — this app isn't deployed anywhere yet, so there's no
Vercel Cron (or equivalent) configured. Once deployed, add a scheduled
trigger (e.g. `vercel.json`'s `crons` field) pointing at that route with
the secret in its `Authorization` header.

Live-verified: `push_subscriptions` table + RLS,
`join_passport_as_caregiver`-adjacent RLS unaffected, opt-in/opt-out
server actions. Not yet live-verified: an actual push notification
arriving on a real device (needs a subscribed browser, which this
environment can't provide), and the sweep's DB queries against real
multi-passport data (unit-tested against fakes only so far).
