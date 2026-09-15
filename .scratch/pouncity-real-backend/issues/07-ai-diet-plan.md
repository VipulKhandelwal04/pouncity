# 07: AI diet plan via AI Gateway (server-side, with guardrail)

**What to build:** `requestDietPlan` calls the AI Gateway from the server (keys never reach the client), applies the diet safety guardrail (vet-constrained, never a prescription diet) before returning, and saves the result to the Diary with the disclaimer shown on screen. The existing templated generator and the manual save path stay as fallback, so the screen is never blocked by a gateway outage. This ticket settles the disclaimer-versus-constraint decision the spec flagged: choose the guardrail model (disclaimer only, or an actual constraint layer) before wiring the gateway. Creates the `diet_plan` table (defined in ticket 02's data model).

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A diet plan is generated server-side from the pet's breed, age, weight, and current food, and saved to the Diary.
- [ ] The safety guardrail is applied before returning; an unsafe or prescription-style suggestion is constrained or rejected.
- [ ] If the gateway is unavailable, the templated or manual path still saves a plan; the screen never hard-depends on the model.
- [ ] The plan records its source (ai, templated, or manual); the disclaimer shows on screen.
- [ ] `tsc --noEmit` is green; tests with a stubbed gateway prove the guardrail constrains an unsafe suggestion and the fallback still saves.
