import { describe, expect, it } from "vitest";
import { joinAsCaregiver } from "./join-as-caregiver";
import type { CaregiverRepository } from "./caregiver-repository";
import type { Passport } from "./passport";

const passport: Passport = {
  id: "passport-1",
  ownerId: "owner-1",
  name: "Biscuit",
  species: "dog",
  breed: "Labrador",
  birthDate: "2022-01-15",
  weightKg: 24.5,
  photoUrl: "https://example.com/biscuit.jpg",
  createdAt: "2026-01-01T00:00:00.000Z",
  quirks: null,
  vetName: null,
  vetPhone: null,
  vetClinic: null,
  shareToken: "valid-token",
};

class FakeCaregiverRepository implements CaregiverRepository {
  public lastJoin: { userId: string; token: string } | null = null;

  async join(userId: string, token: string): Promise<Passport> {
    this.lastJoin = { userId, token };
    if (token !== passport.shareToken) {
      throw new Error("Invalid or expired share link");
    }
    return passport;
  }
}

describe("joinAsCaregiver", () => {
  it("joins the caregiver to the passport a valid token points to", async () => {
    const repo = new FakeCaregiverRepository();

    const result = await joinAsCaregiver("caregiver-1", "valid-token", repo);

    expect(result.id).toBe(passport.id);
    expect(repo.lastJoin).toEqual({ userId: "caregiver-1", token: "valid-token" });
  });

  it("rejects an invalid or revoked token", async () => {
    const repo = new FakeCaregiverRepository();

    await expect(joinAsCaregiver("caregiver-1", "wrong-token", repo)).rejects.toThrow();
  });

  it("rejects a blank token without calling the repository", async () => {
    const repo = new FakeCaregiverRepository();

    await expect(joinAsCaregiver("caregiver-1", "   ", repo)).rejects.toThrow();
    expect(repo.lastJoin).toBeNull();
  });
});
