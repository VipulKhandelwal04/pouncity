export interface EventCounts {
  dietPlanGenerated: number;
  dietPlanViewed: number;
  dailyTrackingTap: number;
  handoverLinkCreated: number;
  handoverLinkOpened: number;
  /** Passports with activity across 2+ of {diet, tracking, handover} — see note below. */
  crossPillarPassports: number;
}

export interface BeliefReport {
  belief1_dietPlanTrust: { dietPlanGenerated: number; dietPlanViewed: number };
  belief2_onePlaceBeatsSingleFeature: { crossPillarPassports: number; note: string };
  belief3_dailyTapHabit: { dailyTrackingTap: number };
  belief4_handoverCalm: { handoverLinkCreated: number; handoverLinkOpened: number };
}

export function buildBeliefReport(counts: EventCounts): BeliefReport {
  return {
    belief1_dietPlanTrust: {
      dietPlanGenerated: counts.dietPlanGenerated,
      dietPlanViewed: counts.dietPlanViewed,
    },
    belief2_onePlaceBeatsSingleFeature: {
      crossPillarPassports: counts.crossPillarPassports,
      note:
        "Not directly instrumented by a single event — the spec's five tracked events don't " +
        "include one for this belief. This counts passports with activity across 2+ of " +
        "{diet, tracking, handover} as a proxy for whether owners engage with the passport as " +
        "a whole rather than a single feature. Treat as suggestive, not a direct measurement.",
    },
    belief3_dailyTapHabit: {
      dailyTrackingTap: counts.dailyTrackingTap,
    },
    belief4_handoverCalm: {
      handoverLinkCreated: counts.handoverLinkCreated,
      handoverLinkOpened: counts.handoverLinkOpened,
    },
  };
}
