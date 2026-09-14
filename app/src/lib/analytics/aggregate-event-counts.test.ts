import { describe, expect, it } from "vitest";
import { aggregateEventCounts } from "./aggregate-event-counts";

describe("aggregateEventCounts", () => {
  it("counts each event type", () => {
    const counts = aggregateEventCounts([
      { passport_id: "p1", event_name: "diet_plan_generated" },
      { passport_id: "p1", event_name: "diet_plan_viewed" },
      { passport_id: "p1", event_name: "diet_plan_viewed" },
      { passport_id: "p2", event_name: "daily_tracking_tap" },
      { passport_id: "p2", event_name: "handover_link_created" },
      { passport_id: "p2", event_name: "handover_link_opened" },
    ]);

    expect(counts.dietPlanGenerated).toBe(1);
    expect(counts.dietPlanViewed).toBe(2);
    expect(counts.dailyTrackingTap).toBe(1);
    expect(counts.handoverLinkCreated).toBe(1);
    expect(counts.handoverLinkOpened).toBe(1);
  });

  it("counts a passport as cross-pillar once it has events in 2+ of {diet, tracking, handover}", () => {
    const counts = aggregateEventCounts([
      // p1: diet + tracking -> cross-pillar
      { passport_id: "p1", event_name: "diet_plan_generated" },
      { passport_id: "p1", event_name: "daily_tracking_tap" },
      // p2: diet only -> not cross-pillar
      { passport_id: "p2", event_name: "diet_plan_viewed" },
      { passport_id: "p2", event_name: "diet_plan_generated" },
      // p3: all three -> cross-pillar (still counted once)
      { passport_id: "p3", event_name: "diet_plan_generated" },
      { passport_id: "p3", event_name: "daily_tracking_tap" },
      { passport_id: "p3", event_name: "handover_link_created" },
    ]);

    expect(counts.crossPillarPassports).toBe(2);
  });

  it("returns all zeros for no events", () => {
    const counts = aggregateEventCounts([]);

    expect(counts).toEqual({
      dietPlanGenerated: 0,
      dietPlanViewed: 0,
      dailyTrackingTap: 0,
      handoverLinkCreated: 0,
      handoverLinkOpened: 0,
      crossPillarPassports: 0,
    });
  });
});
