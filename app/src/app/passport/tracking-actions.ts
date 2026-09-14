"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { SupabaseTrackingRepository } from "@/lib/tracking/supabase-tracking-repository";
import { confirmFedToday } from "@/lib/tracking/tracking-service";
import { todayDateString } from "@/lib/tracking/today";

export async function confirmFedTodayAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const note = formData.get("note");

  const passportRepo = new SupabasePassportRepository(supabase);
  const trackingRepo = new SupabaseTrackingRepository(supabase);

  await confirmFedToday(user.id, todayDateString(), note, passportRepo, trackingRepo);

  revalidatePath("/passport");
}
