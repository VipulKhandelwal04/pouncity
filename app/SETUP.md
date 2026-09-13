# Setup — Ticket 01 (Account creation + Passport creation)

Status: code complete and live-verified against a real Supabase project.

## 1. Supabase project

Uses an existing Supabase project (shared with other, unrelated tables —
that's fine, `passports` is fully namespaced and RLS-scoped to its own
rows). Credentials live in `.env.local` (gitignored, not committed):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.local.example` to `.env.local` and fill in your project's URL
and anon public key from **Project Settings → API**. Never put the
`service_role` key in this file or anywhere in the repo — it bypasses RLS
entirely and this app never needs it (all writes go through the anon key
+ the signed-in user's own session).

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
