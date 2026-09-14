import { describe, expect, it } from "vitest";
import { createPassport } from "./passport-service";
import { generateHandoverLink } from "./generate-handover-link";
import { revokeHandoverLink } from "./revoke-handover-link";
import { getPassportByShareToken } from "./get-passport-by-share-token";
import type { PassportRepository } from "./passport-repository";
import type { PassportShareRepository } from "./passport-share-repository";
import type { Passport } from "./passport";

class InMemoryPassportRepository implements PassportRepository, PassportShareRepository {
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

  async findByShareToken(token: string): Promise<Passport | null> {
    for (const passport of this.passports.values()) {
      if (passport.shareToken === token) return passport;
    }
    return null;
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

describe("generateHandoverLink", () => {
  it("generates a token and stores it on the owner's passport", async () => {
    const repo = new InMemoryPassportRepository();
    const passport = await createPassport(createPassportInput, "owner-1", repo);
    expect(passport.shareToken).toBeNull();

    const token = await generateHandoverLink("owner-1", repo);

    const found = await repo.findByShareToken(token);
    expect(found?.id).toBe(passport.id);
  });

  it("produces a token that isn't trivially guessable (reasonably long, random-looking)", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);

    const token = await generateHandoverLink("owner-1", repo);

    expect(token.length).toBeGreaterThanOrEqual(20);
  });

  it("regenerating produces a different token and invalidates the old one", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);

    const first = await generateHandoverLink("owner-1", repo);
    const second = await generateHandoverLink("owner-1", repo);

    expect(second).not.toBe(first);
    expect(await repo.findByShareToken(first)).toBeNull();
    expect(await repo.findByShareToken(second)).not.toBeNull();
  });

  it("rejects generation when the owner has no passport yet", async () => {
    const repo = new InMemoryPassportRepository();

    await expect(generateHandoverLink("owner-with-no-passport", repo)).rejects.toThrow();
  });
});

describe("revokeHandoverLink", () => {
  it("clears the share token so the old link no longer resolves", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);
    const token = await generateHandoverLink("owner-1", repo);
    expect(await getPassportByShareToken(token, repo)).not.toBeNull();

    await revokeHandoverLink("owner-1", repo);

    expect(await getPassportByShareToken(token, repo)).toBeNull();
  });

  it("leaves the passport revoked (no shareToken) after revoking", async () => {
    const repo = new InMemoryPassportRepository();
    const passport = await createPassport(createPassportInput, "owner-1", repo);
    await generateHandoverLink("owner-1", repo);

    await revokeHandoverLink("owner-1", repo);

    const found = await repo.findByOwnerId("owner-1");
    expect(found?.id).toBe(passport.id);
    expect(found?.shareToken).toBeNull();
  });

  it("is safe to call when there is no active link", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);

    await expect(revokeHandoverLink("owner-1", repo)).resolves.not.toThrow();
  });

  it("rejects revocation when the owner has no passport at all", async () => {
    const repo = new InMemoryPassportRepository();

    await expect(revokeHandoverLink("owner-with-no-passport", repo)).rejects.toThrow();
  });

  it("owner can generate a fresh link after revoking the old one", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);
    const firstToken = await generateHandoverLink("owner-1", repo);
    await revokeHandoverLink("owner-1", repo);

    const newToken = await generateHandoverLink("owner-1", repo);

    expect(newToken).not.toBe(firstToken);
    expect(await getPassportByShareToken(newToken, repo)).not.toBeNull();
  });
});

describe("getPassportByShareToken", () => {
  it("returns the passport for a valid token", async () => {
    const repo = new InMemoryPassportRepository();
    const passport = await createPassport(createPassportInput, "owner-1", repo);
    const token = await generateHandoverLink("owner-1", repo);

    const found = await getPassportByShareToken(token, repo);

    expect(found?.id).toBe(passport.id);
  });

  it("never exposes ownerId or shareToken to an anonymous viewer, even if a future field is added to Passport", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);
    const token = await generateHandoverLink("owner-1", repo);

    const found = await getPassportByShareToken(token, repo);

    expect(found).not.toBeNull();
    expect(found).not.toHaveProperty("ownerId");
    expect(found).not.toHaveProperty("shareToken");
  });

  it("returns null for a token that doesn't match any passport", async () => {
    const repo = new InMemoryPassportRepository();

    const found = await getPassportByShareToken("not-a-real-token", repo);

    expect(found).toBeNull();
  });

  it("returns null once the link has been regenerated (old token no longer works)", async () => {
    const repo = new InMemoryPassportRepository();
    await createPassport(createPassportInput, "owner-1", repo);
    const oldToken = await generateHandoverLink("owner-1", repo);
    await generateHandoverLink("owner-1", repo);

    const found = await getPassportByShareToken(oldToken, repo);

    expect(found).toBeNull();
  });
});
