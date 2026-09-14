import { describe, expect, it } from "vitest";
import { createPassport } from "../passport/passport-service";
import type { PassportRepository } from "../passport/passport-repository";
import type { Passport } from "../passport/passport";
import { generateGroomingGuide, getGroomingGuideForPassport } from "./grooming-guide-service";
import type { GroomingGuideRepository } from "./grooming-guide-repository";
import type {
  GroomingGuide,
  GroomingGuideGenerator,
  GroomingGuideGeneratorInput,
} from "./grooming-guide";

class InMemoryPassportRepository implements PassportRepository {
  private passports = new Map<string, Passport>();

  async insert(passport: Passport): Promise<Passport> {
    this.passports.set(passport.id, passport);
    return passport;
  }

  async findByOwnerId(ownerId: string): Promise<Passport | null> {
    for (const passport of this.passports.values()) {
      if (passport.ownerId === ownerId) return passport;
    }
    return null;
  }

  async update(id: string, updates: Partial<Passport>): Promise<Passport> {
    const existing = this.passports.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...updates };
    this.passports.set(id, updated);
    return updated;
  }
}

class InMemoryGroomingGuideRepository implements GroomingGuideRepository {
  private guides = new Map<string, GroomingGuide>();

  async upsertForPassport(passportId: string, guide: GroomingGuide): Promise<GroomingGuide> {
    this.guides.set(passportId, guide);
    return guide;
  }

  async findByPassportId(passportId: string): Promise<GroomingGuide | null> {
    return this.guides.get(passportId) ?? null;
  }
}

class StubGenerator implements GroomingGuideGenerator {
  public lastInput: GroomingGuideGeneratorInput | null = null;

  async generate(input: GroomingGuideGeneratorInput) {
    this.lastInput = input;
    return {
      frequencyGuidance: `Guidance for ${input.breed}`,
      homeVsProfessionalGuidance: "Home vs pro guidance",
      disclaimer: "Not vet advice.",
      reminderIntervalDays: 14,
    };
  }
}

const createPassportInput = {
  name: "Biscuit",
  species: "dog" as const,
  breed: "Labrador",
  birthDate: "2022-01-15",
  weightKg: 24.5,
  photoUrl: "https://example.com/biscuit.jpg",
};

describe("generateGroomingGuide", () => {
  it("generates and persists a guide using the passport's own species/breed", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();
    const generator = new StubGenerator();
    const passport = await createPassport(createPassportInput, "owner-1", passportRepo);

    const guide = await generateGroomingGuide("owner-1", passportRepo, groomingRepo, generator);

    expect(guide.passportId).toBe(passport.id);
    expect(guide.frequencyGuidance).toBe("Guidance for Labrador");
    expect(guide.reminderIntervalDays).toBe(14);
    expect(generator.lastInput).toEqual({ species: "dog", breed: "Labrador" });
  });

  it("persists the guide so it can be retrieved again later", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const generated = await generateGroomingGuide(
      "owner-1",
      passportRepo,
      groomingRepo,
      generator,
    );
    const fetched = await getGroomingGuideForPassport("owner-1", passportRepo, groomingRepo);

    expect(fetched?.id).toBe(generated.id);
  });

  it("rejects generation when the owner has no passport yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();
    const generator = new StubGenerator();

    await expect(
      generateGroomingGuide("owner-with-no-passport", passportRepo, groomingRepo, generator),
    ).rejects.toThrow();
  });

  it("regenerating keeps the same guide id rather than minting a new one", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const first = await generateGroomingGuide("owner-1", passportRepo, groomingRepo, generator);
    const second = await generateGroomingGuide("owner-1", passportRepo, groomingRepo, generator);

    expect(second.id).toBe(first.id);
  });
});

describe("getGroomingGuideForPassport", () => {
  it("returns null when no guide has been generated yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const result = await getGroomingGuideForPassport("owner-1", passportRepo, groomingRepo);

    expect(result).toBeNull();
  });

  it("returns null when the owner has no passport at all", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const groomingRepo = new InMemoryGroomingGuideRepository();

    const result = await getGroomingGuideForPassport(
      "owner-with-no-passport",
      passportRepo,
      groomingRepo,
    );

    expect(result).toBeNull();
  });
});
