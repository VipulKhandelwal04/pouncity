# 04: Public Handover endpoint (unauthenticated cross-device read)

**What to build:** A public server route resolves a Diary read-only by Handover token, with no account and no session, so a sitter opens the link on their own phone and sees the Diary. This is the one capability that could not exist client-side. Generating the link persists a `handover_token`; opening it records a `handover_open` and returns a read-only Diary subset. The route runs with the service role and enforces `state='active'` itself (ADR-0003 link-as-access), the single path that skips RLS. Creates `handover_token` and `handover_open` (defined in ticket 02's data model).

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Sharing a pet persists an active `handover_token` (link plus short referral code); one active link per pet.
- [ ] A person with no account opens the token on their own device and sees the Diary read-only.
- [ ] The public route serves only an active token and never exposes a signed-in-only field; it runs server-side with the service role, not client RLS.
- [ ] Each open is recorded, so the access list and the opened event in later tickets have data.
- [ ] `tsc --noEmit` is green; a test in a separate storage context (a real second device) reads the Diary by token with no session.
