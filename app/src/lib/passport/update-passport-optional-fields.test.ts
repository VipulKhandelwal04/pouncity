import { describe, expect, it } from "vitest";
import { createPassport } from "./passport-service";
import { updatePassportOptionalFields } from "./update-passport-optional-fields";
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

const createInput = {
  name: "Biscuit",
  species: "dog" as const,
  breed: "Labrador",
  birthDate: "2022-01-15",
  weightKg: 24.5,
  photoUrl: "https://example.com/biscuit.jpg",
};

describe("updatePassportOptionalFields", () => {
  it("sets quirks on a passport that has none yet", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);

    const updated = await updatePassportOptionalFields(
      "owner-1",
      { quirks: "Afraid of vacuums" },
      repo,
    );

    expect(updated.quirks).toBe("Afraid of vacuums");
  });

  it("sets vet contact fields independently of quirks", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);

    const updated = await updatePassportOptionalFields(
      "owner-1",
      { vetName: "Dr. Rao", vetPhone: "555-0100", vetClinic: "Green Paws Clinic" },
      repo,
    );

    expect(updated.vetName).toBe("Dr. Rao");
    expect(updated.vetPhone).toBe("555-0100");
    expect(updated.vetClinic).toBe("Green Paws Clinic");
    expect(updated.quirks).toBeNull();
  });

  it("leaves previously-set fields untouched when only updating one field", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);
    await updatePassportOptionalFields("owner-1", { quirks: "Afraid of vacuums" }, repo);

    const updated = await updatePassportOptionalFields(
      "owner-1",
      { vetName: "Dr. Rao" },
      repo,
    );

    expect(updated.quirks).toBe("Afraid of vacuums");
    expect(updated.vetName).toBe("Dr. Rao");
  });

  it("does not require any field to be present in the update", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);

    await expect(updatePassportOptionalFields("owner-1", {}, repo)).resolves.toBeTruthy();
  });

  it("rejects updates when the owner has no passport yet", async () => {
    const repo = new InMemoryPassportRepository();

    await expect(
      updatePassportOptionalFields("owner-with-no-passport", { quirks: "x" }, repo),
    ).rejects.toThrow();
  });

  it("clears a previously-set field to null when given a blank string", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);
    await updatePassportOptionalFields("owner-1", { quirks: "Afraid of vacuums" }, repo);

    const updated = await updatePassportOptionalFields("owner-1", { quirks: "   " }, repo);

    expect(updated.quirks).toBeNull();
  });

  it("clearing one field does not affect other already-set fields", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createInput, "owner-1", repo);
    await updatePassportOptionalFields(
      "owner-1",
      { quirks: "Afraid of vacuums", vetName: "Dr. Rao" },
      repo,
    );

    const updated = await updatePassportOptionalFields("owner-1", { quirks: "" }, repo);

    expect(updated.quirks).toBeNull();
    expect(updated.vetName).toBe("Dr. Rao");
  });
});
