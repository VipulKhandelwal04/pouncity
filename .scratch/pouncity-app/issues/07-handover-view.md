# 07: Handover view (public, account-free)

> ⚠️ **Superseded 2026-09-14 by ADR-0004 + `.scratch/pouncity-accounts/issues/02`.** Anonymous
> viewing is retired: opening a link signed-out now shows a **sign-in gate**, not the diary.
> This ticket describes the *old* account-free view (built as U7); do **not** build it as written.


**What to build:** A recipient opens a handover link in a fresh browser with **no account**
and sees the **full diary read-only** — feeding state, routine, quirks, vet contact —
clean and mobile-first for one-handed use while caring for the pet. It is visibly a
shared, read-only context (not the recipient's own account), exposes **no owner-only
controls**, and multiple people can open the same link independently. An inline "sign up
to help" entry points to the caregiver flow (ticket 09). The view is rendered by
`diary-service` via a public read token (mocked in this phase).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Opening a handover link with no account shows the full diary read-only
- [ ] The view renders feeding state, routine, quirks, and vet contact, mobile-first
- [ ] It is unmistakably a shared, read-only context — no owner-only controls appear
- [ ] Multiple independent opens of the same link work
- [ ] An inline "sign up to help" entry is present (leads to ticket 09)
- [ ] Rendered from `diary-service` via a public read token; a revoked/invalid token shows a plain "this diary is no longer shared" (revocation itself is ticket 08)
- [ ] Phone-width, one-handed; fast, graceful degradation
