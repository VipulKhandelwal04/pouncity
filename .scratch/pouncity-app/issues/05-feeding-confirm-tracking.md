# 05: Feeding-confirm tracking

**What to build:** The headline control on Diary home becomes a working **Feeding confirm**
— one tap logs "fed today." It clearly shows today's state (fed vs. not yet), is
idempotent (a second tap the same day is a no-op, not a duplicate), and is reversible the
same day (a mistap can be toggled off; still one confirm per day). The owner can optionally
attach a short deviation note via a secondary "add a note," and can see a
reverse-chronological history of past confirms + notes. Each confirm is **attributed**
("Fed today · by Sam") so it reads correctly once caregivers log too, and the reminder
**opt-in toggle** lives here (delivery is the deferred ticket 09).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The hub tap logs a "fed today" confirm and clearly shows today's state (fed / not yet)
- [ ] Tapping again the same day does not create a duplicate (idempotent per diary per day)
- [ ] A same-day confirm can be reversed (toggled off), still one confirm per day
- [ ] Owner can optionally attach a short deviation note to a day's confirm
- [ ] A reverse-chronological history of confirms + notes is viewable
- [ ] Each confirm is attributed to whoever logged it
- [ ] A "remind me on days with no confirm" opt-in toggle is present (UI only; delivery is ticket 09)
- [ ] The tap earns a moment of delight; phone-width, one-handed
