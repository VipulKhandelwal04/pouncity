import type { SupabaseClient } from "@supabase/supabase-js";
import { PassportScopedArtifactRepository } from "@/lib/supabase/passport-scoped-artifact-repository";
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

function toRow(passportId: string, plan: DietPlan): Record<string, unknown> {
  return {
    id: plan.id,
    passport_id: passportId,
    current_food: plan.currentFood,
    daily_calories: plan.dailyCalories,
    feeding_guidance: plan.feedingGuidance,
    disclaimer: plan.disclaimer,
    generated_at: plan.generatedAt,
  };
}

export class SupabaseDietPlanRepository implements DietPlanRepository {
  private readonly inner: PassportScopedArtifactRepository<DietPlan, DietPlanRow>;

  constructor(client: SupabaseClient) {
    this.inner = new PassportScopedArtifactRepository(client, "diet_plans", toDietPlan, toRow);
  }

  upsertForPassport(passportId: string, plan: DietPlan): Promise<DietPlan> {
    return this.inner.upsertForPassport(passportId, plan);
  }

  findByPassportId(passportId: string): Promise<DietPlan | null> {
    return this.inner.findByPassportId(passportId);
  }
}
