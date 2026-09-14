import type {
  DietPlanContent,
  DietPlanGenerator,
  DietPlanGeneratorInput,
} from "./diet-plan";

const DISCLAIMER =
  "This is general guidance based on public nutrition information, not a " +
  "substitute for veterinary advice. If your pet has a diagnosed medical " +
  "condition, please talk to your vet before changing their diet.";

/**
 * A deterministic, rule-based stand-in for a real diet-AI provider. Uses
 * the standard veterinary Resting Energy Requirement formula
 * (RER = 70 * weightKg^0.75) scaled by a flat adult-maintenance factor —
 * not personalized beyond weight, and explicitly not "vet-backed" in any
 * formal sense. Swap for an LLM-backed DietPlanGenerator later without
 * touching callers.
 */
export class PlaceholderDietPlanGenerator implements DietPlanGenerator {
  async generate(input: DietPlanGeneratorInput): Promise<DietPlanContent> {
    const restingEnergyRequirement = 70 * Math.pow(input.weightKg, 0.75);
    const maintenanceFactor = 1.6;
    const dailyCalories = Math.round(restingEnergyRequirement * maintenanceFactor);

    const feedingGuidance =
      `For a ${input.breed} weighing ${input.weightKg}kg, a rough daily ` +
      `target is about ${dailyCalories} kcal. If you're currently feeding ` +
      `${input.currentFood}, check its label for kcal per cup or can to work ` +
      `out a matching portion, and split it across 2 meals a day. Adjust ` +
      `gradually based on your pet's body condition over the next few weeks.`;

    return {
      dailyCalories,
      feedingGuidance,
      disclaimer: DISCLAIMER,
    };
  }
}
