# 03: Feeding confirms and history, cross-device

**What to build:** Feeding confirms move server-side into `feeding_entry`. A confirm is idempotent per Diary per day (tapping twice does not double-log), records who confirmed and an optional deviation note, and the full history reads back across devices, so a confirm made on one device shows on another. Creates the `feeding_entry` table (defined in ticket 02's data model) and swaps the seam's feeding body from localStorage to Postgres.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A Feeding confirm persists server-side and is visible on a second device.
- [ ] Confirming twice on the same day is idempotent (one entry per Diary per day), preserving the existing per-day behavior.
- [ ] Each entry records who confirmed and an optional deviation note; history reads back in date order.
- [ ] `tsc --noEmit` is green; a seam-level test proves a confirm on one client appears on another.
