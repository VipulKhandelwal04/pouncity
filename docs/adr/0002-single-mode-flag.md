# One `MODE` flag swaps the site between waitlist and live

**Status:** accepted (2026-09-13)

Home is identical in pre-launch and post-launch **except** for its primary call-to-action. Rather than maintain two pages, a single build-time constant `MODE = 'waitlist' | 'live'` (set on `<html data-mode>` before first paint, overridable with `?mode=live` for preview) drives which CTA variant is shown — via CSS `[data-mode]` visibility toggles — plus the appearance of the "Sign in" header link. Launch is flipping one value and redeploying.

## Considered options

- **Two separate pages (a waitlist Home and a live Home).** Rejected: the shared ~90% (all the marketing bands) would be duplicated and drift; a flag keeps one source of truth.

## Consequences

Both CTA variants (waitlist → JotForm survey; live → "create your pet's diary" → `/sign-in`) live in the one page and both must be kept in copy-sync. In **waitlist** mode the `/sign-in` page exists but is unlinked; flipping to **live** surfaces it. The flag is the single switch for the whole launch transition.
