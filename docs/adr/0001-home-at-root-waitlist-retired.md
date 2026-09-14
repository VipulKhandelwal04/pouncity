# Home built fresh at `/`; `/join-waitlist` kept alongside it

**Status:** accepted (2026-09-13; amended 2026-09-13)

The permanent marketing front door — **Home** — is built fresh (reusing the design system, not editing the waitlist page in place) and served at `/`. The pre-launch `/join-waitlist` page is **kept live and unchanged at its own URL** — it is *not* retired or redirected, so existing shared links land on exactly the page they always did. `/` and `/join-waitlist` coexist with no redirect between them.

## Amendment

The original decision (2026-09-13) 301-redirected `/join-waitlist` → `/` and moved canonical/OG to `/`. That was reversed the same day at the owner's request: `/join-waitlist` stays reachable and untouched. `vercel.json` therefore declares **no redirects**; Home is self-canonical at `/`, and the waitlist page remains self-canonical at `/join-waitlist`.

## Considered options

- **Rebuild the waitlist page in place and move it to `/`.** Rejected: entangles Home's identity with the waitlist page's URL; a fresh page at `/` is a cleaner front door.
- **301-redirect `/join-waitlist` → `/`.** Rejected by the owner: the waitlist URL must keep working as-is after deployment.

## Consequences

During pre-launch there are two waitlist-capable surfaces: **Home at `/`** (in waitlist mode) and the standalone **`/join-waitlist`** page. They overlap intentionally; keep their survey CTA in sync (both point to the same JotForm). Two near-duplicate indexable pages is a minor SEO consideration, not addressed here.
