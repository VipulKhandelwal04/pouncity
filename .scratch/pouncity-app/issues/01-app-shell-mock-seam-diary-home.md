# 01: App shell + mock diary-service seam + Diary home hub

**What to build:** A signed-in owner lands (from the existing `/sign-in` page) in the app
and sees their pet's **Diary home** — the hub. It shows the pet header (photo, name,
species, breed, age, weight), a slot for the completeness nudge (filled in ticket 03), the
**feeding tap as the headline** control (wired in ticket 05), and status-bearing cards into
**Diet**, **Grooming**, and **Share** plus a recent-activity glance. This slice stands up
the Next.js/React app, the design system (Pouncity tokens/fonts in Operate mode), the app
shell (routing + a way to sign out / see which account you're in), and the single
`diary-service` mock module seeded with one sample diary so every later screen has data to
render. It is the foundation everything else hangs off.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Next.js/React app runs and deploys to Vercel as a UI-only app, isolated from the live static marketing site
- [ ] The `/sign-in` page's primary action routes into the app's Diary home (auth still mocked)
- [ ] One `diary-service` module is the only data source; it returns a seeded diary and persists changes to `localStorage`; no screen touches storage/network/LLM directly
- [ ] Diary home renders the pet header from the seeded diary
- [ ] Cards for Diet / Grooming / Share are present with placeholder status text and open a focused full-screen detail with a simple back (no bottom tab bar)
- [ ] A visible feeding-tap control occupies the headline slot (behavior lands in ticket 05)
- [ ] Owner can sign out and can see which account they're in
- [ ] Operate-mode design: scannable, calm, brand in details; reduced-motion + no-JS fallback parity with the public site
- [ ] Works one-handed at phone width; no horizontal scroll
