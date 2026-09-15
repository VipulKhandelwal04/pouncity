# 04: Diet plan screens

**What to build:** From the Diet card (reading "Not generated yet — tap to create"), the
owner taps "get my diet plan." The flow captures current food/brand **lazily in-flow**
(not at onboarding), shows a working/loading state, then renders a clear plan (what to
feed, how much) with a **persistent, non-dismissible** "general guidance, not veterinary
advice" disclaimer. The plan is saved to the diary and viewable again; the owner can
regenerate it. Plan content is canned/templated in this phase (the real LLM call arrives
behind the seam later). No diagnosed-condition question ever blocks generation.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Diet card shows "Not generated yet — tap to create" until a plan exists; on-demand only (never auto-generated)
- [ ] Tapping starts a flow that captures current food/brand in-flow if not already known
- [ ] A working/loading state shows while the plan "generates"
- [ ] The rendered plan shows what to feed and how much, clearly scannable
- [ ] A persistent, non-dismissible "general guidance, not vet advice" disclaimer is present on every rendered plan
- [ ] The plan saves to the diary and is viewable again; the card flips to "Ready"
- [ ] Owner can regenerate the plan
- [ ] No diagnosed-condition question blocks generation; failure state is human and retryable
