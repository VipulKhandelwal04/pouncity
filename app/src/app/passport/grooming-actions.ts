"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { SupabaseGroomingGuideRepository } from "@/lib/grooming/supabase-grooming-guide-repository";
import { generateGroomingGuide } from "@/lib/grooming/grooming-guide-service";
import { PlaceholderGroomingGuideGenerator } from "@/lib/grooming/placeholder-grooming-guide-generator";

// Placeholder generator, same swappable-port pattern as diet-plan-actions.ts.
const generator = new PlaceholderGroomingGuideGenerator();

export async function generateGroomingGuideAction() {
  const { supabase, user } = await requireUser();

  const passportRepo = new SupabasePassportRepository(supabase);
  const groomingRepo = new SupabaseGroomingGuideRepository(supabase);

  await generateGroomingGuide(user.id, passportRepo, groomingRepo, generator);

  revalidatePath("/passport");
}
