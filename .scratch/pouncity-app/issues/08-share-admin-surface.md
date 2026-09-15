# 08: Share / admin surface (owner)

> ⚠️ **Partly reworked 2026-09-14 by `.scratch/pouncity-accounts/issues/06` + ADR-0004.** Built as
> U8, but under the account model: "recent opens" is **dropped**, "who has access" becomes the
> **named Caregivers** list, and a **Referral code** joins the link. The revoke/regenerate flow here
> carries forward.


**What to build:** From the Share card, the owner manages access to their diary as a calm
control panel (not a scary security screen). They can generate a standing handover link
and copy / system-share it; see **who currently has access** under the link-as-access model
(a recent-opens count for anonymous Viewers + a named Caregivers list, informational); and
**revoke** access — a single, confirmed, destructive-feeling, whole-link action ("ends
access for everyone; share a new link after") that immediately makes the handover view
stop returning diary data — then **regenerate** a fresh link. Per-caregiver removal is out
of scope (v2). Backed by `diary-service`'s handover-link lifecycle (mocked in this phase).

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Owner can generate a standing (non-expiring) handover link and copy / system-share it
- [ ] The panel shows a recent-opens count (Viewers, counted not named) + a named Caregivers list (informational)
- [ ] Revoke is whole-link only, requires explicit confirmation, and reads as "ends access for everyone"
- [ ] After revoke, the handover view (ticket 07) immediately stops returning diary data
- [ ] Owner can regenerate a fresh link; the old token stays dead
- [ ] No per-caregiver removal in this pilot (v2)
- [ ] Reads as a calm control panel, not a security screen; phone-width, one-handed
