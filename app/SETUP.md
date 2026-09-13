# Setup — Ticket 01 (Account creation + Passport creation)

This app is code-complete for Ticket 01, but needs credentials from a real
Supabase project before auth and passport creation work end-to-end. None of
this could be created on your behalf — it requires your accounts.

## 1. Create a Supabase project

1. Go to https://supabase.com and create a new project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public
   key**.
3. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run the database migrations

In the Supabase dashboard's **SQL Editor**, run the two files in
`supabase/migrations/` in order:

1. `0001_passports.sql` — creates the `passports` table with row-level
   security scoped to the signed-in owner.
2. `0002_passport_photos_bucket.sql` — creates the public `passport-photos`
   storage bucket with upload/read policies.

(If you install the Supabase CLI and link the project, `supabase db push`
will apply both automatically instead.)

## 3. Enable magic link auth

Magic link (email OTP) is enabled by default in Supabase Auth — no action
needed beyond having a valid email provider configured (Supabase's default
works for testing; configure a custom SMTP provider before real users rely
on it, since the default has strict rate limits).

## 4. Enable Google OAuth

1. Create an OAuth 2.0 Client ID in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add this app's Supabase auth callback URL as an authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase dashboard: **Authentication → Providers → Google**, paste the
   Client ID and Client Secret, and enable the provider.

## 5. Run it

```bash
npm install
npm run dev
```

Visit `/login`, sign in via magic link or Google, and you should land on
`/passport/new` to create a passport, then `/passport` to view it.

## What's already verified without credentials

- `npm run typecheck` — passes
- `npm run lint` — passes
- `npm test` — 11 passing unit tests on the passport domain logic
  (`src/lib/passport/passport-service.test.ts`), using an in-memory fake
  repository. These do not require Supabase and will keep passing regardless
  of credentials.

## Not yet verified (needs your Supabase project)

- Magic link email delivery and callback flow
- Google OAuth sign-in flow
- Passport creation actually persisting to Postgres via
  `SupabasePassportRepository`
- Photo upload to Supabase Storage
- Row-level security actually restricting owners to their own passport
