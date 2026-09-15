# Find Care stays referral-only; the sitter marketplace is deferred

**Status:** accepted (2026-09-15).

Comparing the built app against the shared "Pouncity Find Care" prototype, which
models a two-sided marketplace with paid stranger sitters, the product owner
decided the app stays **referral-only**. You reach a **Caregiver** only through a
**Handover link** / **Referral code** (ADR-0003, ADR-0004), never through public
discovery of strangers. "Find Care" is not a directory; it collapses into the
**Circle** surface as an invite / refer action. A paid sitter remains a *context*
of a Caregiver (see `CONTEXT.md`), not a separate Sitter entity.

## Why this needs recording

The prototype makes the marketplace look like the headline feature, so a future
reader will assume it is the plan. It is not: with no OTP or identity provider,
a stranger's identity cannot be verified, so stranger sitting is not merely lower
priority, it is currently **unbuildable to a safe standard**. The explicit no
stops someone rebuilding it without the verification it requires.

## Deferred as one verification-gated epic

Unlocked only when an identity / verification provider exists:

- Public verified-sitter marketplace (stranger discovery)
- Sitter onboarding + public sitter profile
- Identity verification (the linchpin that unblocks the rest)
- Requests / booking inbox
- Dual owner + sitter profile
- Owner-vs-sitter role chooser
- Public / aggregated reputation (**Ratings stay private and one-way**, Owner to
  Caregiver, until then — see the Rating term in `CONTEXT.md`)
