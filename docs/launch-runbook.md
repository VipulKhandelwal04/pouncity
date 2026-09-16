# Pouncity V2 — Launch Runbook (waitlist → live app)

How to take the V2 owner app from "built but not deployed" to **live for external
users** on `pouncity.vercel.app` (or a custom domain), and how to roll back.

Written 2026-09-16, after backend tickets 01–11 landed on `main`. Do the phases
in order. Nothing here touches production until **Phase 5**.

---

## 0. Where we are now (the starting state)

- **Production** = `pouncity.vercel.app`, **waitlist-only**, held that way by three
  guards on `main`:
  1. root `index.html` + `sign-in/` are **deleted** on `main`,
  2. `V2` is listed in root **`.vercelignore`**,
  3. root **`vercel.json`** redirects `/` → `/join-waitlist`.
- **The app** (`V2/`) is a self-contained Next.js app with the full backend on
  Supabase project **`jpikxumahmhgtqpliqho`** (migrations `0002`–`0011` applied).
  It serves marketing at `/` (via `V2/public/*.html` + rewrites) and the app at
  `/diary`, `/care/[id]`, `/d/[token]`, `/sign-in`.
- **Sign-in = Google only** (PR #21). Email sign-in (magic link / one-time code)
  is intentionally disabled at launch: Resend has no verified sending domain, so
  it cannot deliver to external addresses. Re-enabling email later is UI-only —
  the `requestMagicLink` / `verifyEmailCode` seam is still in `diary-service`.
- Everything runs locally via `V2/.env.local`; **nothing is set in Vercel yet**.

---

## 1. Prerequisites (off-production; the long pole)

### 1a. 🔴 Configure Google sign-in — the real blocker
With email disabled, **Google is the only way in**, so this gates the launch:
1. Google Cloud Console → create an OAuth 2.0 Client (Web application).
2. Authorized redirect URIs must include both
   `https://jpikxumahmhgtqpliqho.supabase.co/auth/v1/callback` and
   `<PROD_ORIGIN>/auth/callback`.
3. **OAuth consent screen must be "In production" (published), NOT "Testing"** —
   in Testing mode only whitelisted test users can sign in, which blocks every
   external user (the whole audience of this launch).
4. Supabase → Auth → Providers → **Google** → paste the Client ID + secret, enable.

> **(Deferred) Resend sending domain** — not needed for a Google-only launch.
> Only when you want the email sign-in path back: buy a domain, Resend → Domains →
> Add Domain → add SPF / DKIM / DMARC → **Verified**, set the sender, then restore
> the email form on `/sign-in`.

### 1b. Decide the public URL
Either keep `pouncity.vercel.app`, or point the custom domain at the Vercel
project (recommended — same domain brands the site *and* the email). Call this
`<PROD_ORIGIN>` below (e.g. `https://pouncity.app`).

### 1c. Replace the placeholder belief statements
Edit `V2/lib/beliefs.ts` — the four `BELIEFS` strings are a derived placeholder;
put your real pilot beliefs there (wording only; no code change).

---

## 2. Supabase production config (dashboard — project `jpikxumahmhgtqpliqho`)

- **Auth → URL Configuration**
  - Site URL = `<PROD_ORIGIN>`
  - Redirect URLs += `<PROD_ORIGIN>/**` (covers `/auth/callback`)
- **Auth → Providers → Google (required)** — the only sign-in at launch. Confirm
  the provider from 1a is enabled, and that both `<PROD_ORIGIN>/auth/callback` and
  the Supabase callback URL are on the OAuth client, with the consent screen "In
  production".
- **(Deferred — email path)** SMTP sender, Email OTP length/expiry, and the Magic
  Link template only matter once you re-enable the email form; skip them for a
  Google-only launch.
- Re-run **Advisors → Security**; confirm no ERROR-level findings (the SECURITY
  DEFINER WARNs on `is_diary_owner` / `is_my_caregiver` / `is_my_past_caregiver` /
  `handle_new_user` are intentional and safe).

> The Supabase project itself is production-ready — RLS is enforced and verified
> on every table. It doubles as the pilot DB; no separate prod project needed to
> start.

---

## 3. Vercel environment variables

In the Vercel project (`dream-lord/pouncity`) → **Settings → Environment
Variables**, add for **Production** (and Preview if you stage there) — values
come from `V2/.env.local`:

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | secret — `/api/handover`, cron, analytics report |
| `GROQ_API_KEY` | secret — AI diet/grooming |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | public — push subscribe |
| `VAPID_PRIVATE_KEY` | secret — push send (cron) |
| `VAPID_SUBJECT` | e.g. `mailto:hello@<domain>` |
| `CRON_SECRET` | secret — authorizes the cron + analytics report routes |

---

## 4. Stage on a preview + human smoke test (do NOT skip)

Deploy V2 to a preview (the existing **`pouncity-preview`** project, or a Vercel
preview) with the **same env vars**, then walk the core flows by hand — these are
the paths verified only at the DB/seam level, never through a real browser:

- [ ] Sign in with **Google, using a real external account** (not your own, not a
      whitelisted test user — this proves 1a and that the consent screen is
      published) → land on `/diary/welcome` → set name.
- [ ] Create a diary → hub renders.
- [ ] Feeding tap → mark fed; open on a second device → shows fed (cross-device).
- [ ] Diet plan: generate (AI) → a plan appears, disclaimer shown; check copy has
      no em dashes. Grooming guide: same.
- [ ] Share → create handover link → open the link in a private window / another
      device → sign up as a caregiver → land on `/care/[id]` (read-only + can feed).
- [ ] Reminder toggle → grant the notification permission → a `push_subscription`
      row appears (Supabase). Trigger the cron manually to confirm a send:
      `curl -H "authorization: Bearer $CRON_SECRET" <PREVIEW_ORIGIN>/api/cron/reminders`
- [ ] Revoke the link → the caregiver's `/care` shows "access ended".
- [ ] Analytics report:
      `curl -H "authorization: Bearer $CRON_SECRET" <PREVIEW_ORIGIN>/api/analytics/report`
      shows the events you just generated mapped to beliefs.
- [ ] Open-redirect guard: `<PREVIEW_ORIGIN>/auth/callback?next=//evil.com`
      redirects to `/diary`, not off-site.

Fix anything that breaks here **before** Phase 5.

---

## 5. The production flip (cutover — reversible)

**Recommended (dashboard-only, cleanest):** point the Vercel project at V2.
1. Vercel → project `dream-lord/pouncity` → **Settings → Build & Deployment →
   Root Directory** = `V2`.
   - Vercel now builds the V2 Next app (using `V2/vercel.json`, which already has
     the reminder **cron**). The root `.vercelignore` and the root `vercel.json`
     `/`→`/join-waitlist` redirect stop applying, because the build root is `V2/`.
   - V2 serves marketing at `/` (from `V2/public/*.html` + its rewrites) and the
     app at `/diary`, so the whole site is one deploy.
2. **Verify `V2/public/index.html` is the marketing you want live** (it's a real
   copy that can drift from the repo-root version — reconcile if needed). Note
   `sign-in.html` and `join-waitlist.html` were removed in PR #21: `/sign-in` is
   the React app route, and `/join-waitlist` now 307-redirects to `/`.
3. Trigger a production deploy (Vercel → Redeploy, or push a trivial commit to
   `main`).

**Alternative (code restructure):** move `V2/` contents to the repo root and drop
the waitlist `vercel.json` redirect + `.vercelignore`. More churn; only do this if
you don't want a Root-Directory setting. The dashboard route above is simpler and
just as reversible.

> Custom domain: Vercel → project → **Domains** → add `<domain>` and follow the
> DNS steps. Do this before or right after the flip.

---

## 6. Post-flip verification (production)

- [ ] `<PROD_ORIGIN>/` serves the app's marketing home (not a 307 to
      `/join-waitlist`).
- [ ] `/sign-in`, `/diary`, `/d/<token>` all load.
- [ ] A **real external** person can sign in with Google (a non-test account).
- [ ] Vercel → **Cron** tab shows the `/api/cron/reminders` job scheduled; check
      its logs after the first run (or trigger it manually with `CRON_SECRET`).
- [ ] Supabase → Logs + Advisors look clean under real traffic.

---

## 7. Rollback (if the flip goes wrong)

Fast and clean:
- Set Vercel **Root Directory back to** the repo root (empty) and redeploy →
  production returns to the waitlist-only site immediately.
- (If you used the code-restructure alternative instead, revert the flip commit
  on `main`.)

No data migration is involved in the flip, so rollback is just a redeploy.

---

## 8. After launch

- Watch the analytics belief report to see which bets the pilot supports.
- Confirm the daily reminder cron is actually sending (Vercel Cron logs +
  `push_subscription` rows).
- Deferred niceties noted during the build: a "no diet plan yet" empty state for
  caregivers whose owner never made one; per-caregiver removal (v2);
  Resend/Groq/push spend monitoring.

---

## Quick reference — what each secret powers

| Secret | Powers |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | public handover route, reminder cron, analytics report |
| `GROQ_API_KEY` | AI diet + grooming generation |
| `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` | sending web-push reminders (cron) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client push subscribe |
| `CRON_SECRET` | authorizes `/api/cron/reminders` and `/api/analytics/report` |
| Google OAuth (Supabase provider + Google Cloud client) | the only sign-in at launch |
| Resend verified domain | (deferred) delivering sign-in emails if/when email is re-enabled |
