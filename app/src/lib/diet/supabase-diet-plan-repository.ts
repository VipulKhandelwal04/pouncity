import type { SupabaseClient } from "@supabase/supabase-js";
import type { DietPlan } from "./diet-plan";
import type { DietPlanRepository } from "./diet-plan-repository";

interface DietPlanRow {
  id: string;
  passport_id: string;
  current_food: string;
  daily_calories: number;
  feeding_guidance: string;
  disclaimer: string;
  generated_at: string;
}

function toDietPlan(row: DietPlanRow): DietPlan {
  return {
    id: row.id,
    passportId: row.passport_id,
    currentFood: row.current_food,
    dailyCalories: row.daily_calories,
    feedingGuidance: row.feeding_guidance,
    disclaimer: row.disclaimer,
    generatedAt: row.generated_at,
  };
}

export class SupabaseDietPlanRepository implements DietPlanRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertForPassport(passportId: string, plan: DietPlan): Promise<DietPlan> {
    const { data, error } = await this.client
      .from("diet_plans")
      .upsert(
        {
          id: plan.id,
          passport_id: passportId,
          current_food: plan.currentFood,
          daily_calories: plan.dailyCalories,
          feeding_guidance: plan.feedingGuidance,
          disclaimer: plan.disclaimer,
          generated_at: plan.generatedAt,
        },
        { onConflict: "passport_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return toDietPlan(data as DietPlanRow);
  }

  async findByPassportId(passportId: string): Promise<DietPlan | null> {
    const { data, error } = await this.client
      .from("diet_plans")
      .select()
      .eq("passport_id", passportId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDietPlan(data as DietPlanRow) : null;
  }
}
