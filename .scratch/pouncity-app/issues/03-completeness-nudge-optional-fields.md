# 03: Complete-diary nudge + optional fields

**What to build:** On Diary home, the owner sees a non-blocking "complete your diary"
indicator that names exactly which pieces are still missing (quirks, vet contact, diet
plan, grooming guide) and updates the moment one is added. The owner can add/edit
free-text **quirks** and a **vet contact** (name, phone, clinic), and can dismiss/minimize
the nudge once they've done enough. The nudge is presentational over diary state — it
never gates using the rest of the app.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Diary home shows a completeness indicator naming the specific missing pieces
- [ ] Owner can add/edit free-text quirks; they save and show on the diary
- [ ] Owner can add/edit vet contact (name, phone, clinic); it saves and shows on the diary
- [ ] The indicator updates immediately when a field is added
- [ ] Owner can dismiss/minimize the nudge; a "finished enough" diary stops nagging
- [ ] The nudge never blocks any other screen or action
- [ ] Empty/optional fields never present as errors; phone-width, one-handed
