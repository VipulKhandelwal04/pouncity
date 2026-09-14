export interface GroomingGuide {
  id: string;
  passportId: string;
  frequencyGuidance: string;
  homeVsProfessionalGuidance: string;
  disclaimer: string;
  /** Days between recurring grooming reminders, derived from the guide. */
  reminderIntervalDays: number;
  generatedAt: string;
}

export interface GroomingGuideGeneratorInput {
  species: "dog" | "cat";
  breed: string;
}

export interface GroomingGuideContent {
  frequencyGuidance: string;
  homeVsProfessionalGuidance: string;
  disclaimer: string;
  reminderIntervalDays: number;
}

/**
 * A port for whatever actually produces guide content — a placeholder,
 * rule-based generator today, an LLM call later, same pattern as
 * DietPlanGenerator.
 */
export interface GroomingGuideGenerator {
  generate(input: GroomingGuideGeneratorInput): Promise<GroomingGuideContent>;
}
