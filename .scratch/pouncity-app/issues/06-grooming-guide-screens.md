# 06: Grooming guide screens

**What to build:** From the Grooming card, the owner taps "get my grooming guide." The flow
captures **coat type lazily in-flow** if not already known, shows a working state, then
renders the guide as breed/coat norms plus a recommended frequency (the home-care-vs-
professional split), with the same persistent, non-dismissible "general guidance, not vet
advice" disclaimer. A recurring grooming reminder can be scheduled from the guide (opt-in
toggle; delivery is the deferred ticket 09). The guide saves to the diary and is viewable
again. Guide content is canned/templated in this phase.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Grooming card is on-demand ("get my grooming guide"); never auto-generated
- [ ] The flow captures coat type in-flow if not already known
- [ ] A working/loading state shows while the guide "generates"
- [ ] The guide renders as breed/coat norms + a recommended frequency
- [ ] The same persistent, non-dismissible "general guidance, not vet advice" disclaimer is present
- [ ] A recurring grooming reminder can be scheduled (opt-in toggle; UI only, delivery is ticket 09)
- [ ] The guide saves to the diary and is viewable again; the card flips to "Due in N wks"
- [ ] Human failure/empty states; phone-width, one-handed
