# 01: Make the diary-service seam async (prefactor)

**What to build:** Convert every exported function on the `diary-service` seam to return a Promise, and update every call site to await it, while the seam stays localStorage-backed. The app behaves identically for the user; this is a mechanical prefactor so the later backend swaps are a clean body change with no call-site churn. This is the one wide refactor in the set (its blast radius fans across every screen that reads or writes the seam), so run it expand-contract, per the spec: add the async form beside the sync one, migrate the call sites in batches, then remove the sync form once nothing calls it. "Make the change easy, then make the easy change."

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Every exported `diary-service` function returns a Promise; no synchronous seam call remains anywhere in the app.
- [ ] Every existing flow (create and edit Diary, Feeding confirm, diet and grooming, handover create/resolve/revoke, caregiver binding) behaves exactly as before.
- [ ] The single-seam rule still holds: no screen reads storage, network, or an LLM directly.
- [ ] The seam is still localStorage-backed at the end of this ticket (no Supabase yet). This is purely the sync to async shape change.
- [ ] `tsc --noEmit` is green.
