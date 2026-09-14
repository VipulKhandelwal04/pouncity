export type AnalyticsEventName =
  | "diet_plan_generated"
  | "diet_plan_viewed"
  | "daily_tracking_tap"
  | "handover_link_created"
  | "handover_link_opened";

export interface AnalyticsEventRepository {
  record(passportId: string, eventName: AnalyticsEventName): Promise<void>;
}
