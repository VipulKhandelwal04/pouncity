import { describe, expect, it } from "vitest";
import { isFeedingReminderDue, isGroomingReminderDue } from "./reminder-decision";

describe("isFeedingReminderDue", () => {
  it("is due when there is no confirm today and no reminder already sent today", () => {
    expect(isFeedingReminderDue({ confirmedToday: false, alreadyRemindedToday: false })).toBe(
      true,
    );
  });

  it("is not due once feeding has been confirmed today", () => {
    expect(isFeedingReminderDue({ confirmedToday: true, alreadyRemindedToday: false })).toBe(
      false,
    );
  });

  it("is not due again if a reminder was already sent today, even without a confirm", () => {
    expect(isFeedingReminderDue({ confirmedToday: false, alreadyRemindedToday: true })).toBe(
      false,
    );
  });
});

describe("isGroomingReminderDue", () => {
  it("is not due before the interval has elapsed since the last reminder", () => {
    const now = new Date("2026-03-15T00:00:00.000Z");
    const lastReminderOrGeneratedAt = "2026-03-10T00:00:00.000Z"; // 5 days ago

    const due = isGroomingReminderDue({
      reminderIntervalDays: 14,
      lastReminderOrGeneratedAt,
      now,
    });

    expect(due).toBe(false);
  });

  it("is due once the interval has fully elapsed", () => {
    const now = new Date("2026-03-24T00:00:00.000Z");
    const lastReminderOrGeneratedAt = "2026-03-10T00:00:00.000Z"; // 14 days ago

    const due = isGroomingReminderDue({
      reminderIntervalDays: 14,
      lastReminderOrGeneratedAt,
      now,
    });

    expect(due).toBe(true);
  });

  it("is due well past the interval, not just capped at exactly due", () => {
    const now = new Date("2026-04-15T00:00:00.000Z");
    const lastReminderOrGeneratedAt = "2026-03-10T00:00:00.000Z";

    const due = isGroomingReminderDue({
      reminderIntervalDays: 14,
      lastReminderOrGeneratedAt,
      now,
    });

    expect(due).toBe(true);
  });
});
