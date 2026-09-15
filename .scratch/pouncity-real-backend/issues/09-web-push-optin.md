# 09: Web push subscription and service worker (opt-in)

**What to build:** Opting in registers a service worker and a VAPID Web Push subscription for the current device, stored per person, and the reminder preference (feeding, grooming) persists per person per Diary. Declining leaves the app fully usable (the no-guilt hard rail); reminders are never a wall. Creates the `push_subscription` and `reminder_pref` tables (defined in ticket 02's data model). This ticket sets up subscription and opt-in only; actual delivery is ticket 10.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Opting in registers a service worker and stores a push subscription for the device.
- [ ] The reminder opt-in preference (feeding, grooming) persists per person per Diary.
- [ ] Declining notifications leaves every feature fully usable; nothing is gated behind push.
- [ ] `tsc --noEmit` is green; a test proves a stored subscription round-trips and that declining blocks nothing.
