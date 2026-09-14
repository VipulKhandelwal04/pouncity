"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabaseDietPlanRepository } from "@/lib/diet/supabase-diet-plan-repository";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { generateDietPlan } from "@/lib/diet/diet-plan-service";
import { PlaceholderDietPlanGenerator } from "@/lib/diet/placeholder-diet-plan-generator";

// Placeholder generator per ticket scope — swap for a real LLM-backed
// DietPlanGenerator later without touching this action or the service layer.
const generator = new PlaceholderDietPlanGenerator();

export async function generateDietPlanAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const currentFood = formData.get("currentFood");

  const passportRepo = new SupabasePassportRepository(supabase);
  const dietRepo = new SupabaseDietPlanRepository(supabase);

  await generateDietPlan(user.id, currentFood, passportRepo, dietRepo, generator);

  revalidatePath("/passport");
}
