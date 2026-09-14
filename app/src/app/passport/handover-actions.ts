"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { generateHandoverLink } from "@/lib/passport/generate-handover-link";
import { revokeHandoverLink } from "@/lib/passport/revoke-handover-link";
import { SupabaseAnalyticsEventRepository } from "@/lib/analytics/supabase-analytics-event-repository";

export async function generateHandoverLinkAction() {
  const { supabase, user } = await requireUser();

  const passportRepo = new SupabasePassportRepository(supabase);
  await generateHandoverLink(user.id, passportRepo);

  // generateHandoverLink returns just the token; re-fetching the passport
  // here (rather than changing its return shape) keeps that well-tested
  // function's signature untouched, at the cost of one extra lookup —
  // same trade-off made in tracking-actions.ts.
  const passport = await passportRepo.findByOwnerId(user.id);
  if (passport) {
    const analyticsRepo = new SupabaseAnalyticsEventRepository(supabase);
    await analyticsRepo.record(passport.id, "handover_link_created");
  }

  revalidatePath("/passport");
}

export async function revokeHandoverLinkAction() {
  const { supabase, user } = await requireUser();

  const passportRepo = new SupabasePassportRepository(supabase);
  await revokeHandoverLink(user.id, passportRepo);

  revalidatePath("/passport");
}
