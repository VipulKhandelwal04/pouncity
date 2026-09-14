import type { DietPlan } from "./diet-plan";

export interface DietPlanRepository {
  /** Inserts a plan, or replaces the existing one for that passport. */
  upsertForPassport(passportId: string, plan: DietPlan): Promise<DietPlan>;
  findByPassportId(passportId: string): Promise<DietPlan | null>;
}
