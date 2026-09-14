export interface DietPlan {
  id: string;
  passportId: string;
  currentFood: string;
  dailyCalories: number;
  feedingGuidance: string;
  disclaimer: string;
  generatedAt: string;
}

export interface DietPlanGeneratorInput {
  species: "dog" | "cat";
  breed: string;
  birthDate: string;
  weightKg: number;
  currentFood: string;
}

export interface DietPlanContent {
  dailyCalories: number;
  feedingGuidance: string;
  disclaimer: string;
}

/**
 * A port for whatever actually produces plan content — a placeholder,
 * rule-based generator today, an LLM call later. Swapping the
 * implementation shouldn't require touching the service or repository
 * layers.
 */
export interface DietPlanGenerator {
  generate(input: DietPlanGeneratorInput): Promise<DietPlanContent>;
}
