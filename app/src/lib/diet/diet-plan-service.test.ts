import { describe, expect, it } from "vitest";
import { createPassport } from "../passport/passport-service";
import type { PassportRepository } from "../passport/passport-repository";
import type { Passport } from "../passport/passport";
import { generateDietPlan, getDietPlanForPassport } from "./diet-plan-service";
import type { DietPlanRepository } from "./diet-plan-repository";
import type { DietPlan, DietPlanGenerator, DietPlanGeneratorInput } from "./diet-plan";

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

class InMemoryDietPlanRepository implements DietPlanRepository {
  private plans = new Map<string, DietPlan>();

  async upsertForPassport(passportId: string, plan: DietPlan): Promise<DietPlan> {
    this.plans.set(passportId, plan);
    return plan;
  }

  async findByPassportId(passportId: string): Promise<DietPlan | null> {
    return this.plans.get(passportId) ?? null;
  }
}

class StubGenerator implements DietPlanGenerator {
  public lastInput: DietPlanGeneratorInput | null = null;

  async generate(input: DietPlanGeneratorInput) {
    this.lastInput = input;
    return {
      dailyCalories: 500,
      feedingGuidance: `Guidance for ${input.breed}`,
      disclaimer: "Not vet advice.",
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

describe("generateDietPlan", () => {
  it("generates and persists a plan using the passport's own breed/species/weight/birthDate", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();
    const passport = await createPassport(createPassportInput, "owner-1", passportRepo);

    const plan = await generateDietPlan(
      "owner-1",
      "Brand X kibble",
      passportRepo,
      dietRepo,
      generator,
    );

    expect(plan.passportId).toBe(passport.id);
    expect(plan.currentFood).toBe("Brand X kibble");
    expect(plan.dailyCalories).toBe(500);
    expect(plan.feedingGuidance).toBe("Guidance for Labrador");
    expect(plan.disclaimer).toBe("Not vet advice.");
    expect(generator.lastInput).toEqual({
      species: "dog",
      breed: "Labrador",
      birthDate: "2022-01-15",
      weightKg: 24.5,
      currentFood: "Brand X kibble",
    });
  });

  it("persists the plan so it can be retrieved again later", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const generated = await generateDietPlan(
      "owner-1",
      "Brand X kibble",
      passportRepo,
      dietRepo,
      generator,
    );
    const fetched = await getDietPlanForPassport("owner-1", passportRepo, dietRepo);

    expect(fetched?.id).toBe(generated.id);
  });

  it("rejects generation when the owner has no passport yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();

    await expect(
      generateDietPlan("owner-with-no-passport", "Brand X", passportRepo, dietRepo, generator),
    ).rejects.toThrow();
  });

  it("rejects generation when currentFood is blank", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await expect(
      generateDietPlan("owner-1", "   ", passportRepo, dietRepo, generator),
    ).rejects.toThrow();
  });

  it("regenerating replaces the previous plan's content for that passport", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await generateDietPlan("owner-1", "Brand X", passportRepo, dietRepo, generator);
    const second = await generateDietPlan("owner-1", "Brand Y", passportRepo, dietRepo, generator);
    const fetched = await getDietPlanForPassport("owner-1", passportRepo, dietRepo);

    expect(fetched?.id).toBe(second.id);
    expect(fetched?.currentFood).toBe("Brand Y");
  });

  it("regenerating keeps the same plan id rather than minting a new one", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    const generator = new StubGenerator();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const first = await generateDietPlan("owner-1", "Brand X", passportRepo, dietRepo, generator);
    const second = await generateDietPlan("owner-1", "Brand Y", passportRepo, dietRepo, generator);

    expect(second.id).toBe(first.id);
  });
});

describe("getDietPlanForPassport", () => {
  it("returns null when no plan has been generated yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const result = await getDietPlanForPassport("owner-1", passportRepo, dietRepo);

    expect(result).toBeNull();
  });

  it("returns null when the owner has no passport at all", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const dietRepo = new InMemoryDietPlanRepository();

    const result = await getDietPlanForPassport("owner-with-no-passport", passportRepo, dietRepo);

    expect(result).toBeNull();
  });
});
