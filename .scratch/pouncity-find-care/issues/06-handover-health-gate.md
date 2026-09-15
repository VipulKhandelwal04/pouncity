# 06: Handover health gate

**What to build:** When the Owner creates or regenerates their Diary's Handover link (now from the Circle, per 02), the app first checks the pet's health essentials and blocks creation until they are present, naming exactly what is missing and letting the Owner complete-and-continue without starting over. The required set is species/breed, rabies status, vet contact, and the free-text "anything a caregiver should know." The seam exposes a handover-readiness predicate that reports the missing fields; the gate fires only at handover creation or regeneration, nowhere else, so daily use is never interrupted. These fields already exist on the Diary shape, so this is validation and a completion prompt, not a schema change.

**Blocked by:** 02.

**Status:** done (built + browser-verified 2026-09-15; local/uncommitted)

- [x] The seam exposes a readiness predicate that reports which required fields are missing for a Diary.
- [x] Creating or regenerating the Handover link from the Circle is blocked when any required field is missing, and the block names exactly the missing fields.
- [x] After the Owner completes the missing fields, link creation continues without restarting.
- [x] The required set is species/breed, rabies status, vet contact, and "anything a caregiver should know"; everything else stays optional.
- [x] The gate does not fire on any non-handover screen.
- [x] `tsc --noEmit` passes.

## Build notes (2026-09-15)

- **Seam:** `handoverReadiness(diary): { ready, missing[] }` reports missing required fields (breed, rabies status, vet contact, "anything a caregiver should know" = quirks). Validation only — these fields already exist on the Diary, no schema change. Called ONLY from the Circle's create/replace handlers (grep-confirmed), so the gate fires nowhere else.
- **Circle:** `createLink` and `replaceLink` run the predicate first; if not ready they show a coral gate card ("Before you share {pet} … Add: {missing}") with **"Complete {pet}'s details" → /diary/edit** and "Not now", and do NOT create/replace the link. Once the basics are present, the same button creates the link (complete-and-continue; nothing to restart).
- Browser-verified: bare Pip (no rabies/vet/quirks) → Create blocked, names exactly those 3 (breed present, excluded), token stays null; complete the 3 → Create succeeds; **regenerate** on a shared pet with vet stripped → blocked, names only "vet contact", old link untouched; "Not now" dismisses; gate predicate used only in the Circle; 360px zero overflow. `tsc` green.
- ⚠️ **Flagged model limitation (needs a product call later):** `rabies` is null both when a pet is *not vaccinated* and when it is *not recorded*, so "rabies status present" = "a rabies record exists". An owner of a genuinely-unvaccinated pet cannot satisfy the gate without a tri-state rabies field (vaccinated / not / unknown). Held per the grill (Q11: health record mandatory before handover); revisit if unvaccinated pets need to be shareable.

**Epic status:** 🎯 all 7 Find Care tickets done (01, 02, 03, 04, 05, 06, 07).
