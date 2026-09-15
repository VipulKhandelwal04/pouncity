# 10: Reminder scheduler and delivery

**What to build:** A scheduled server job (cron) evaluates, for each Diary with reminders on, whether a Feeding confirm exists for the day and sends a feeding reminder if not, and sends a grooming reminder on the guide's frequency. The evaluation is a pure, testable function separate from delivery; the scheduler reads prefs and subscriptions via the service role, and expired push endpoints are cleaned up on send failure.

**Blocked by:** 09, 03, 08.

**Status:** ready-for-agent

- [ ] With reminders on and no confirm logged for the day, the evaluation yields a feeding reminder; with a confirm, it yields none.
- [ ] A grooming reminder is sent on the guide's frequency.
- [ ] The scheduler reads prefs and subscriptions via the service role; a failed endpoint is removed.
- [ ] `tsc --noEmit` is green; the pure evaluation function is tested directly, separate from actual push delivery.
