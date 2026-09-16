import type { AnalyticsEvent } from "./beliefs";

/**
 * The product-analytics taxonomy (Mixpanel). Two layers share it:
 *
 * - The five belief events (beliefs.ts) keep landing in the Supabase
 *   analytics_event table exactly as before (ticket 11) AND mirror to
 *   Mixpanel.
 * - The funnel events below are Mixpanel-only: they complete the journey
 *   (sign-in -> pet created -> plans -> daily habit -> handover -> churn)
 *   but test no pilot belief, so the Supabase table never sees them.
 */
export type FunnelEvent =
  | "signed_in"
  | "diary_created"
  | "grooming_guide_generated"
  | "grooming_guide_viewed"
  | "pet_removed";

export type ProductEvent = AnalyticsEvent | FunnelEvent;

/**
 * Events the browser may submit through /api/track. `signed_in` and
 * `handover_opened` are recorded server-side (auth callback / handover gate)
 * and deliberately excluded so a client can't forge them.
 */
export type ClientProductEvent = Exclude<ProductEvent, "signed_in" | "handover_opened">;

export const CLIENT_EVENTS: readonly ClientProductEvent[] = [
  "diary_created",
  "diet_plan_generated",
  "diet_plan_viewed",
  "grooming_guide_generated",
  "grooming_guide_viewed",
  "daily_feeding_tap",
  "handover_created",
  "pet_removed",
];

/** Mixpanel display names (Title Case, Mixpanel's convention). */
export const MIXPANEL_NAME: Record<ProductEvent, string> = {
  signed_in: "Signed In",
  diary_created: "Diary Created",
  diet_plan_generated: "Diet Plan Generated",
  diet_plan_viewed: "Diet Plan Viewed",
  grooming_guide_generated: "Grooming Guide Generated",
  grooming_guide_viewed: "Grooming Guide Viewed",
  daily_feeding_tap: "Daily Feeding Tap",
  handover_created: "Handover Created",
  handover_opened: "Handover Opened",
  pet_removed: "Pet Removed",
};
