import { describe, expect, it } from "vitest";
import { PlaceholderGroomingGuideGenerator } from "./placeholder-grooming-guide-generator";

const generator = new PlaceholderGroomingGuideGenerator();

describe("PlaceholderGroomingGuideGenerator", () => {
  it("mentions the breed in the frequency guidance", async () => {
    const result = await generator.generate({ species: "dog", breed: "Labrador" });

    expect(result.frequencyGuidance).toContain("Labrador");
  });

  it("gives cats a longer reminder interval than dogs, reflecting lower grooming frequency", async () => {
    const dog = await generator.generate({ species: "dog", breed: "Labrador" });
    const cat = await generator.generate({ species: "cat", breed: "Domestic Shorthair" });

    expect(cat.reminderIntervalDays).toBeGreaterThan(dog.reminderIntervalDays);
  });

  it("always includes a positive reminder interval and a non-empty disclaimer", async () => {
    const result = await generator.generate({ species: "dog", breed: "Poodle" });

    expect(result.reminderIntervalDays).toBeGreaterThan(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it("includes guidance on home care vs seeing a professional", async () => {
    const result = await generator.generate({ species: "dog", breed: "Poodle" });

    expect(result.homeVsProfessionalGuidance.length).toBeGreaterThan(0);
    expect(result.homeVsProfessionalGuidance).not.toBe(result.frequencyGuidance);
  });

  it("is deterministic for the same input", async () => {
    const input = { species: "dog" as const, breed: "Beagle" };

    const first = await generator.generate(input);
    const second = await generator.generate(input);

    expect(first).toEqual(second);
  });
});
