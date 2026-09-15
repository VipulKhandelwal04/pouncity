# 05: Handover access list, server-enforced revocation, Past Caregiver (and private Rating)

**What to build:** The Owner sees who currently has Access via the link, and can revoke it so Access stops immediately on every device (the server flips the token state, not the browser). On revoke, each person whose access ended is retained as a private Past Caregiver (ADR-0006), readable only by the Owner and granting no access, and a fresh link can be generated to re-share. This ticket also persists the Owner's private Rating of a Caregiver (user story 8), written when a handover ends, visible only to the Owner and never aggregated (ADR-0005). Creates `past_caregiver` and `rating` (defined in ticket 02's data model).

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] The Owner sees who currently has Access (from the recorded opens).
- [ ] Revoke flips the token state server-side; the public route returns nothing immediately on every device.
- [ ] Each person whose access ended is retained as a private Past Caregiver, readable only by the Owner, with no access to the Diary.
- [ ] The Owner can generate a fresh link after revoke.
- [ ] The Owner's private Rating of a Caregiver persists server-side, Owner-only, and survives revoke and re-share.
- [ ] `tsc --noEmit` is green; tests prove revoke stops a second device's read, the Past Caregiver is retained without access, and a Rating is readable only by its Owner.

> Note: `rating` had no dedicated ticket in the presented breakdown. User story 8 ("my Ratings stored privately server-side") puts it in scope, and it is written at the revoke moment and scoped Owner-only alongside Past Caregiver, so it is folded here. Split it into its own ticket if you would rather.
