import { describe, expect, it } from "vitest";
import { createPassport } from "../passport/passport-service";
import type { PassportRepository } from "../passport/passport-repository";
import type { PassportAccessRepository } from "../passport/passport-access-repository";
import type { Passport } from "../passport/passport";
import { confirmFedToday, getTrackingHistory } from "./tracking-service";
import type { TrackingRepository } from "./tracking-repository";
import type { TrackingEntry } from "./tracking-entry";

class InMemoryPassportRepository implements PassportRepository, PassportAccessRepository {
  private passports = new Map<string, Passport>();
  private caregivers = new Map<string, string>(); // caregiverUserId -> passportId

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

  /** Test-only helper — real caregiver joining is exercised in join-as-caregiver.test.ts. */
  addCaregiver(userId: string, passportId: string) {
    this.caregivers.set(userId, passportId);
  }

  async findAccessiblePassportForUser(userId: string): Promise<Passport | null> {
    const owned = await this.findByOwnerId(userId);
    if (owned) return owned;

    const caregiverPassportId = this.caregivers.get(userId);
    return caregiverPassportId ? (this.passports.get(caregiverPassportId) ?? null) : null;
  }
}

class InMemoryTrackingRepository implements TrackingRepository {
  private entries = new Map<string, TrackingEntry>();

  private key(passportId: string, date: string) {
    return `${passportId}:${date}`;
  }

  async findByPassportIdAndDate(
    passportId: string,
    date: string,
  ): Promise<TrackingEntry | null> {
    return this.entries.get(this.key(passportId, date)) ?? null;
  }

  async upsertForDate(passportId: string, entry: TrackingEntry): Promise<TrackingEntry> {
    this.entries.set(this.key(passportId, entry.date), entry);
    return entry;
  }

  async findByPassportId(passportId: string): Promise<TrackingEntry[]> {
    return [...this.entries.values()]
      .filter((e) => e.passportId === passportId)
      .sort((a, b) => b.date.localeCompare(a.date));
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

describe("confirmFedToday", () => {
  it("creates a tracking entry for the given date with no note by default", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    const passport = await createPassport(createPassportInput, "owner-1", passportRepo);

    const entry = await confirmFedToday(
      "owner-1",
      "2026-03-01",
      undefined,
      passportRepo,
      trackingRepo,
    );

    expect(entry.passportId).toBe(passport.id);
    expect(entry.date).toBe("2026-03-01");
    expect(entry.note).toBeNull();
  });

  it("accepts an empty string for note the same as undefined, since a real form always submits '' rather than omitting the field", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const entry = await confirmFedToday("owner-1", "2026-03-01", "", passportRepo, trackingRepo);

    expect(entry.note).toBeNull();
  });

  it("attaches a note when one is provided", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const entry = await confirmFedToday(
      "owner-1",
      "2026-03-01",
      "Extra treat after the walk",
      passportRepo,
      trackingRepo,
    );

    expect(entry.note).toBe("Extra treat after the walk");
  });

  it("confirming the same date twice does not create a second entry", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await confirmFedToday("owner-1", "2026-03-01", undefined, passportRepo, trackingRepo);
    await confirmFedToday("owner-1", "2026-03-01", undefined, passportRepo, trackingRepo);

    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);
    expect(history).toHaveLength(1);
  });

  it("confirming again the same date with a new note updates the note in place", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await confirmFedToday("owner-1", "2026-03-01", "First note", passportRepo, trackingRepo);
    const second = await confirmFedToday(
      "owner-1",
      "2026-03-01",
      "Updated note",
      passportRepo,
      trackingRepo,
    );

    expect(second.note).toBe("Updated note");
    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);
    expect(history).toHaveLength(1);
  });

  it("confirming again the same date without a note keeps the previously-set note", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await confirmFedToday("owner-1", "2026-03-01", "Extra treat", passportRepo, trackingRepo);
    const second = await confirmFedToday(
      "owner-1",
      "2026-03-01",
      undefined,
      passportRepo,
      trackingRepo,
    );

    expect(second.note).toBe("Extra treat");
  });

  it("confirming a different date creates a separate entry", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await confirmFedToday("owner-1", "2026-03-01", undefined, passportRepo, trackingRepo);
    await confirmFedToday("owner-1", "2026-03-02", undefined, passportRepo, trackingRepo);

    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);
    expect(history).toHaveLength(2);
  });

  it("lets a caregiver (not the owner) confirm feeding on the same passport", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    const passport = await createPassport(createPassportInput, "owner-1", passportRepo);
    passportRepo.addCaregiver("caregiver-1", passport.id);

    const entry = await confirmFedToday(
      "caregiver-1",
      "2026-03-01",
      undefined,
      passportRepo,
      trackingRepo,
    );

    expect(entry.passportId).toBe(passport.id);
    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);
    expect(history).toHaveLength(1);
  });

  it("rejects confirmation when the owner has no passport yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();

    await expect(
      confirmFedToday("owner-with-no-passport", "2026-03-01", undefined, passportRepo, trackingRepo),
    ).rejects.toThrow();
  });

  it("rejects an invalid date format", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    await expect(
      confirmFedToday("owner-1", "not-a-date", undefined, passportRepo, trackingRepo),
    ).rejects.toThrow();
  });
});

describe("getTrackingHistory", () => {
  it("returns entries most-recent-date first", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);
    await confirmFedToday("owner-1", "2026-03-01", undefined, passportRepo, trackingRepo);
    await confirmFedToday("owner-1", "2026-03-03", undefined, passportRepo, trackingRepo);
    await confirmFedToday("owner-1", "2026-03-02", undefined, passportRepo, trackingRepo);

    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);

    expect(history.map((e) => e.date)).toEqual(["2026-03-03", "2026-03-02", "2026-03-01"]);
  });

  it("returns an empty list when the owner has a passport but no confirms yet", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();
    await createPassport(createPassportInput, "owner-1", passportRepo);

    const history = await getTrackingHistory("owner-1", passportRepo, trackingRepo);

    expect(history).toEqual([]);
  });

  it("returns an empty list when the owner has no passport at all", async () => {
    const passportRepo = new InMemoryPassportRepository();
    const trackingRepo = new InMemoryTrackingRepository();

    const history = await getTrackingHistory("owner-with-no-passport", passportRepo, trackingRepo);

    expect(history).toEqual([]);
  });
});
