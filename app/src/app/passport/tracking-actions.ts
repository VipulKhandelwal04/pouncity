"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportAccessRepository } from "@/lib/passport/supabase-passport-access-repository";
import { SupabaseTrackingRepository } from "@/lib/tracking/supabase-tracking-repository";
import { confirmFedToday } from "@/lib/tracking/tracking-service";
import { todayDateString } from "@/lib/tracking/today";

// Uses the owner-or-caregiver access repository rather than the
// owner-only one — this single action already works for both, per
// Ticket 08, with no separate caregiver-specific action needed.
export async function confirmFedTodayAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const note = formData.get("note");

  const passportAccessRepo = new SupabasePassportAccessRepository(supabase);
  const trackingRepo = new SupabaseTrackingRepository(supabase);

  const entry = await confirmFedToday(
    user.id,
    todayDateString(),
    note,
    passportAccessRepo,
    trackingRepo,
  );

  revalidatePath("/passport");
  revalidatePath(`/care/${entry.passportId}`);
}
