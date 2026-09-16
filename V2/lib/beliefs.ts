/**
 * Pilot analytics events + the belief statements they test (ticket 11).
 * Pure constants (no imports) so both the client `track` seam and the server
 * handover/report routes can share them.
 *
 * NOTE: the four belief statements were not written down anywhere in the repo,
 * so the wording below is derived from the product (diet-plan wedge, daily care
 * habit, temporary handover) and is meant for the team to edit. Only these
 * strings change; the event -> belief mapping is the load-bearing part.
 */

export type AnalyticsEvent =
  | "diet_plan_generated"
  | "diet_plan_viewed"
  | "daily_feeding_tap"
  | "handover_created"
  | "handover_opened";

export const BELIEFS = {
  diet_wedge: "Owners want AI-personalized diet guidance (the diet plan is the way in).",
  daily_habit: "Owners will build a daily care habit (the one-tap feeding confirm sticks).",
  handover_need: "Owners need to hand their pet to a sitter and will set up a handover link.",
  handover_works: "The handover works for the sitter (they open the link and use it).",
} as const;

export type BeliefKey = keyof typeof BELIEFS;

export const EVENT_BELIEF: Record<AnalyticsEvent, BeliefKey> = {
  diet_plan_generated: "diet_wedge",
  diet_plan_viewed: "diet_wedge",
  daily_feeding_tap: "daily_habit",
  handover_created: "handover_need",
  handover_opened: "handover_works",
};
