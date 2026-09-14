import { describe, expect, it } from "vitest";
import { createPassport, getPassportForOwner } from "./passport-service";
import type { PassportRepository } from "./passport-repository";
import type { Passport } from "./passport";

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

const validInput = {
  name: "Biscuit",
  species: "dog" as const,
  breed: "Labrador",
  birthDate: "2022-01-15",
  weightKg: 24.5,
  photoUrl: "https://example.com/biscuit.jpg",
};

describe("createPassport", () => {
  it("creates a passport when all required fields are present", async () => {
    const repo = new InMemoryPassportRepository();

    const passport = await createPassport(validInput, "owner-1", repo);

    expect(passport.name).toBe("Biscuit");
    expect(passport.ownerId).toBe("owner-1");
    expect(passport.id).toBeTruthy();
  });

  it("rejects creation when name is missing", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, name: "" };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when species is missing", async () => {
    const repo = new InMemoryPassportRepository();
    const { species, ...input } = validInput;
    void species;

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when species is not dog or cat", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, species: "parrot" };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when breed is missing", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, breed: "" };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when birthDate is missing", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, birthDate: "" };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when weightKg is missing or not positive", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, weightKg: 0 };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("rejects creation when photoUrl is missing", async () => {
    const repo = new InMemoryPassportRepository();
    const input = { ...validInput, photoUrl: "" };

    await expect(createPassport(input, "owner-1", repo)).rejects.toThrow();
  });

  it("persists the created passport so it can be retrieved by owner", async () => {
    const repo = new InMemoryPassportRepository();

    const created = await createPassport(validInput, "owner-1", repo);
    const found = await getPassportForOwner("owner-1", repo);

    expect(found?.id).toBe(created.id);
  });
});

describe("getPassportForOwner", () => {
  it("returns null when the owner has no passport yet", async () => {
    const repo = new InMemoryPassportRepository();

    const found = await getPassportForOwner("owner-with-no-passport", repo);

    expect(found).toBeNull();
  });

  it("lets a returning owner see their existing passport without recreating it", async () => {
    const repo = new InMemoryPassportRepository();
    const created = await createPassport(validInput, "owner-1", repo);

    const found = await getPassportForOwner("owner-1", repo);

    expect(found).toEqual(created);
  });
});
