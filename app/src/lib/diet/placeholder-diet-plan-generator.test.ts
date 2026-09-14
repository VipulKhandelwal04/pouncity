import { describe, expect, it } from "vitest";
import { PlaceholderDietPlanGenerator } from "./placeholder-diet-plan-generator";

const generator = new PlaceholderDietPlanGenerator();

describe("PlaceholderDietPlanGenerator", () => {
  it("produces a positive daily calorie estimate that scales with weight", async () => {
    const lighter = await generator.generate({
      species: "dog",
      breed: "Chihuahua",
      birthDate: "2023-01-01",
      weightKg: 3,
      currentFood: "Brand X kibble",
    });
    const heavier = await generator.generate({
      species: "dog",
      breed: "Labrador",
      birthDate: "2023-01-01",
      weightKg: 30,
      currentFood: "Brand X kibble",
    });

    expect(lighter.dailyCalories).toBeGreaterThan(0);
    expect(heavier.dailyCalories).toBeGreaterThan(lighter.dailyCalories);
  });

  it("mentions the breed and current food in the feeding guidance", async () => {
    const result = await generator.generate({
      species: "dog",
      breed: "Labrador",
      birthDate: "2023-01-01",
      weightKg: 24.5,
      currentFood: "Brand X kibble",
    });

    expect(result.feedingGuidance).toContain("Labrador");
    expect(result.feedingGuidance).toContain("Brand X kibble");
  });

  it("always includes a non-empty disclaimer distinct from the guidance", async () => {
    const result = await generator.generate({
      species: "cat",
      breed: "Domestic Shorthair",
      birthDate: "2020-06-15",
      weightKg: 4.2,
      currentFood: "Brand Y wet food",
    });

    expect(result.disclaimer.length).toBeGreaterThan(0);
    expect(result.disclaimer).not.toBe(result.feedingGuidance);
    expect(result.disclaimer.toLowerCase()).toContain("veterinar");
  });

  it("is deterministic for the same input, since it isn't a real model yet", async () => {
    const input = {
      species: "dog" as const,
      breed: "Beagle",
      birthDate: "2022-03-01",
      weightKg: 12,
      currentFood: "Brand Z",
    };

    const first = await generator.generate(input);
    const second = await generator.generate(input);

    expect(first).toEqual(second);
  });
});
