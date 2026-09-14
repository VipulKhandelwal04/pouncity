import { describe, expect, it } from "vitest";
import { passportCompleteness } from "./passport-completeness";
import type { Passport } from "./passport";

const basePassport: Passport = {
  id: "p1",
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
};

describe("passportCompleteness", () => {
  it("reports 0 of 4 filled when no optional fields are set", () => {
    const result = passportCompleteness(basePassport);

    expect(result.filled).toBe(0);
    expect(result.total).toBe(4);
    expect(result.missing).toEqual(["quirks", "vetName", "vetPhone", "vetClinic"]);
  });

  it("reports partial completion when some optional fields are set", () => {
    const passport: Passport = { ...basePassport, quirks: "Afraid of vacuums" };

    const result = passportCompleteness(passport);

    expect(result.filled).toBe(1);
    expect(result.missing).toEqual(["vetName", "vetPhone", "vetClinic"]);
  });

  it("reports 4 of 4 filled and no missing fields when everything is set", () => {
    const passport: Passport = {
      ...basePassport,
      quirks: "Afraid of vacuums",
      vetName: "Dr. Rao",
      vetPhone: "555-0100",
      vetClinic: "Green Paws Clinic",
    };

    const result = passportCompleteness(passport);

    expect(result.filled).toBe(4);
    expect(result.missing).toEqual([]);
  });

  it("treats an empty string the same as unset", () => {
    const passport: Passport = { ...basePassport, quirks: "" };

    const result = passportCompleteness(passport);

    expect(result.filled).toBe(0);
    expect(result.missing).toContain("quirks");
  });
});
