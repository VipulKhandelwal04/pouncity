# 02: Create + edit diary screens

**What to build:** A first-time owner creates their diary through an onboarding form
(name, species, breed, age/birthdate, weight, photo) that writes to the `diary-service`,
then lands on Diary home showing what they entered. Any owner can later open an edit
surface and change any core field; edits are independent (one field at a time is fine) and
persist. The create form refuses to finish until all required core fields are present.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A new (empty-seam) owner is taken to a create-diary form instead of a populated hub
- [ ] Create form collects name, species, breed, age/birthdate, weight, photo and writes them through `diary-service`
- [ ] Create cannot complete while any required core field is missing, with clear per-field validation
- [ ] After creating, the owner lands on Diary home reflecting the entered data
- [ ] Owner can open an edit surface and change any core field; changes persist and re-render the hub
- [ ] Photo upload works UI-side (local object URL in this phase; blob storage arrives with the backend)
- [ ] Human empty/error states; phone-width, one-handed
