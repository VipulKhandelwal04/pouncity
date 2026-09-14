import type {
  GroomingGuideContent,
  GroomingGuideGenerator,
  GroomingGuideGeneratorInput,
} from "./grooming-guide";

const DISCLAIMER =
  "This is general guidance based on public information, not a substitute " +
  "for veterinary or professional groomer advice. Coat condition and skin " +
  "issues are worth a vet visit rather than guesswork.";

/**
 * A deterministic, rule-based stand-in for a real grooming-AI provider —
 * same placeholder pattern as PlaceholderDietPlanGenerator. Presented as a
 * static-feeling breed/coat guide rather than a dynamic personalized plan,
 * per the spec. Swap for an LLM-backed GroomingGuideGenerator later.
 */
export class PlaceholderGroomingGuideGenerator implements GroomingGuideGenerator {
  async generate(input: GroomingGuideGeneratorInput): Promise<GroomingGuideContent> {
    const reminderIntervalDays = input.species === "cat" ? 28 : 14;

    const frequencyGuidance =
      `As a general starting point for a ${input.breed}, aim for a full ` +
      `groom roughly every ${reminderIntervalDays} days, with a quick brush ` +
      `in between to manage shedding and catch mats early.`;

    const homeVsProfessionalGuidance =
      `Brushing, nail checks, and ear cleaning are usually fine to do at ` +
      `home between grooms. Consider a professional groomer for a full ` +
      `trim, or if you notice matting you can't work out, skin irritation, ` +
      `or your ${input.breed} is anxious about being handled.`;

    return {
      frequencyGuidance,
      homeVsProfessionalGuidance,
      disclaimer: DISCLAIMER,
      reminderIntervalDays,
    };
  }
}
