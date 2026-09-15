# 09: Caregiver sign-up + interact UI

> ⚠️ **Superseded 2026-09-14 — do NOT build as written.** Reworked under the account model in
> `.scratch/pouncity-accounts/issues/` (03 join+binding, 04 caregiver view) + ADR-0004. Key change:
> a Caregiver is a signed-in **Account** with a per-diary role — the same person can be an Owner
> elsewhere — not "a Viewer, not the owner." Build the `pouncity-accounts` slices instead.


**What to build:** From the handover view, a Viewer who wants to actively help taps "sign
up to help" and signs up **reusing the passwordless `/sign-in`** (magic link or Google;
mocked in this phase). Signing up binds their account to **that specific diary** as a
**Caregiver** — a helper, not the owner. A signed-up caregiver can log the daily
**Feeding confirm** themselves (which the owner sees, attributed) and opt into reminders
for that diary, but **cannot** edit the diary or manage sharing. Their access still ends
the moment the owner revokes the link (ticket 08).

**Blocked by:** 07, 05

**Status:** ready-for-agent

- [ ] A Viewer on the handover view can choose to sign up, reusing the `/sign-in` mechanism
- [ ] Signing up binds the account to that specific diary as a Caregiver
- [ ] The signed-up caregiver can log a "fed today" confirm; it shows on the owner's history attributed to them
- [ ] The caregiver can opt into reminders for that diary (UI only; delivery is ticket 09/backend)
- [ ] The UI makes it unambiguous they are a helper: they can log + view, not edit the diary or manage sharing
- [ ] When the owner revokes the link, the caregiver loses access too
- [ ] Phone-width, one-handed
