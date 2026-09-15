# 11: Pilot analytics, five events, belief report

**What to build:** A thin `lib/analytics.ts` `track(event, props)` boundary emits the five pilot events (diet plan generated, diet plan viewed, daily Feeding tap, Handover link created, Handover link opened by recipient) to an event store, each tagged with the belief statement it tests, plus a viewable report mapping each event to one of the four belief statements. The daily tap dedupes once per Diary per day; the open dedupes per unique recipient. Kept out of `diary-service` because it is cross-cutting. Creates the `analytics_event` table (defined in ticket 02's data model).

**Blocked by:** 03, 04, 07.

**Status:** ready-for-agent

- [ ] Each of the five events fires per its rule; the daily tap logs once per Diary per day, the open once per unique recipient.
- [ ] Each event is tagged with the belief statement it tests.
- [ ] A report maps each event to one of the four belief statements and is viewable by the team.
- [ ] Analytics is a separate seam (`track`), not inside `diary-service`; `tsc --noEmit` is green; the `track` boundary is tested, not the vendor.
