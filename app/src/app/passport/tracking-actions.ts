"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportAccessRepository } from "@/lib/passport/supabase-passport-access-repository";
import { SupabaseTrackingRepository } from "@/lib/tracking/supabase-tracking-repository";
import { confirmFedToday } from "@/lib/tracking/tracking-service";
import { todayDateString } from "@/lib/tracking/today";
import { SupabaseAnalyticsEventRepository } from "@/lib/analytics/supabase-analytics-event-repository";

// Uses the owner-or-caregiver access repository rather than the
// owner-only one — this single action already works for both, per
// Ticket 08, with no separate caregiver-specific action needed.
export async function confirmFedTodayAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const note = formData.get("note");

  const passportAccessRepo = new SupabasePassportAccessRepository(supabase);
  const trackingRepo = new SupabaseTrackingRepository(supabase);
  const today = todayDateString();

  // Determined before the confirm call, not derived from it, so
  // tracking-service.ts's well-tested signature doesn't need an analytics
  // dependency injected into it — a cross-cutting concern like this is
  // kept at the action layer. "exactly once per day per passport" means
  // this only fires on the first confirm of the day, not a same-day update.
  const passport = await passportAccessRepo.findAccessiblePassportForUser(user.id);
  const alreadyConfirmedToday = passport
    ? Boolean(await trackingRepo.findByPassportIdAndDate(passport.id, today))
    : false;

  const entry = await confirmFedToday(
    user.id,
    today,
    note,
    passportAccessRepo,
    trackingRepo,
  );

  if (!alreadyConfirmedToday) {
    const analyticsRepo = new SupabaseAnalyticsEventRepository(supabase);
    await analyticsRepo.record(entry.passportId, "daily_tracking_tap");
  }

  revalidatePath("/passport");
  revalidatePath(`/care/${entry.passportId}`);
}
