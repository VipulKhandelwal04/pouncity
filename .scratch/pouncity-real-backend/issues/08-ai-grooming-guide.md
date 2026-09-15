# 08: AI grooming guide via AI Gateway

**What to build:** The same server-side pattern as the diet plan, reusing the gateway wiring from ticket 07. `requestGroomingGuide` generates from the pet's breed and coat type, returns a recommended frequency (which later drives grooming reminders), saves to the Diary, and keeps the templated and manual paths as fallback. Creates the `grooming_guide` table (defined in ticket 02's data model).

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] A grooming guide is generated server-side from breed and coat type, with a recommended frequency, and saved to the Diary.
- [ ] The templated or manual path still saves a guide when the gateway is unavailable.
- [ ] The guide records its source; the recommended frequency is stored for the reminder schedule.
- [ ] `tsc --noEmit` is green; tests mirror ticket 07 with a stubbed gateway.
