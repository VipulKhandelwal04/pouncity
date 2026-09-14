import type { AnalyticsEventName } from "./analytics-event";
import type { EventCounts } from "./belief-report";

export interface AnalyticsEventRow {
  passport_id: string;
  event_name: AnalyticsEventName;
}

type Pillar = "diet" | "tracking" | "handover";

const PILLAR_BY_EVENT: Record<AnalyticsEventName, Pillar> = {
  diet_plan_generated: "diet",
  diet_plan_viewed: "diet",
  daily_tracking_tap: "tracking",
  handover_link_created: "handover",
  handover_link_opened: "handover",
};

export function aggregateEventCounts(rows: AnalyticsEventRow[]): EventCounts {
  const counts: EventCounts = {
    dietPlanGenerated: 0,
    dietPlanViewed: 0,
    dailyTrackingTap: 0,
    handoverLinkCreated: 0,
    handoverLinkOpened: 0,
    crossPillarPassports: 0,
  };

  const pillarsByPassport = new Map<string, Set<Pillar>>();

  for (const row of rows) {
    switch (row.event_name) {
      case "diet_plan_generated":
        counts.dietPlanGenerated++;
        break;
      case "diet_plan_viewed":
        counts.dietPlanViewed++;
        break;
      case "daily_tracking_tap":
        counts.dailyTrackingTap++;
        break;
      case "handover_link_created":
        counts.handoverLinkCreated++;
        break;
      case "handover_link_opened":
        counts.handoverLinkOpened++;
        break;
    }

    const pillars = pillarsByPassport.get(row.passport_id) ?? new Set<Pillar>();
    pillars.add(PILLAR_BY_EVENT[row.event_name]);
    pillarsByPassport.set(row.passport_id, pillars);
  }

  counts.crossPillarPassports = [...pillarsByPassport.values()].filter(
    (pillars) => pillars.size >= 2,
  ).length;

  return counts;
}
