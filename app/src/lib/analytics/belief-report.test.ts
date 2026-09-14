import { describe, expect, it } from "vitest";
import { buildBeliefReport } from "./belief-report";

describe("buildBeliefReport", () => {
  it("maps raw event counts onto the four pilot belief statements", () => {
    const report = buildBeliefReport({
      dietPlanGenerated: 5,
      dietPlanViewed: 12,
      dailyTrackingTap: 40,
      handoverLinkCreated: 3,
      handoverLinkOpened: 7,
      crossPillarPassports: 2,
    });

    expect(report.belief1_dietPlanTrust).toEqual({ dietPlanGenerated: 5, dietPlanViewed: 12 });
    expect(report.belief3_dailyTapHabit).toEqual({ dailyTrackingTap: 40 });
    expect(report.belief4_handoverCalm).toEqual({
      handoverLinkCreated: 3,
      handoverLinkOpened: 7,
    });
    expect(report.belief2_onePlaceBeatsSingleFeature.crossPillarPassports).toBe(2);
    expect(report.belief2_onePlaceBeatsSingleFeature.note.length).toBeGreaterThan(0);
  });

  it("handles all-zero counts without throwing", () => {
    const report = buildBeliefReport({
      dietPlanGenerated: 0,
      dietPlanViewed: 0,
      dailyTrackingTap: 0,
      handoverLinkCreated: 0,
      handoverLinkOpened: 0,
      crossPillarPassports: 0,
    });

    expect(report.belief1_dietPlanTrust.dietPlanGenerated).toBe(0);
  });
});
