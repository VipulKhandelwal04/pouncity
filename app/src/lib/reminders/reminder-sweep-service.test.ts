import { describe, expect, it } from "vitest";
import { runReminderSweep } from "./reminder-sweep-service";
import type {
  PassportReminderState,
  ReminderKind,
  ReminderRecipient,
  ReminderSweepRepository,
} from "./reminder-sweep-repository";
import type { PushMessage, PushSendResult, PushSender } from "./push-sender";
import type { PushSubscription } from "./push-subscription";

class FakeReminderSweepRepository implements ReminderSweepRepository {
  public states: PassportReminderState[] = [];
  public recipients = new Map<string, ReminderRecipient[]>();
  public recordedSends: Array<{ passportId: string; kind: ReminderKind; sentAt: string }> = [];
  public deletedSubscriptions: Array<{ userId: string; endpoint: string }> = [];

  async findAllPassportReminderStates(): Promise<PassportReminderState[]> {
    return this.states;
  }

  async findRecipientsForPassport(passportId: string): Promise<ReminderRecipient[]> {
    return this.recipients.get(passportId) ?? [];
  }

  async recordReminderSent(passportId: string, kind: ReminderKind, sentAt: string): Promise<void> {
    this.recordedSends.push({ passportId, kind, sentAt });
  }

  async deleteSubscription(userId: string, endpoint: string): Promise<void> {
    this.deletedSubscriptions.push({ userId, endpoint });
  }
}

class FakePushSender implements PushSender {
  public sent: Array<{ subscription: PushSubscription; message: PushMessage }> = [];
  public nextResult: PushSendResult = { ok: true, expired: false };

  async send(subscription: PushSubscription, message: PushMessage): Promise<PushSendResult> {
    this.sent.push({ subscription, message });
    return this.nextResult;
  }
}

function subscription(userId: string, endpoint = "https://push.example.com/x"): PushSubscription {
  return {
    id: `sub-${endpoint}`,
    userId,
    endpoint,
    p256dhKey: "p256dh",
    authKey: "auth",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const now = new Date("2026-03-15T12:00:00.000Z");

describe("runReminderSweep", () => {
  it("sends and records a feeding reminder when not confirmed today and not already reminded", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].message.body).toContain("Biscuit");
    expect(repo.recordedSends).toEqual([{ passportId: "p1", kind: "feeding", sentAt: now.toISOString() }]);
  });

  it("does not send a feeding reminder when already confirmed today", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: true,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(sender.sent).toHaveLength(0);
    expect(repo.recordedSends).toHaveLength(0);
  });

  it("does not send a feeding reminder twice on the same day", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: "2026-03-15T09:00:00.000Z",
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(sender.sent).toHaveLength(0);
  });

  it("sends a grooming reminder once the interval has elapsed since the guide was generated", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: true,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: 14,
        groomingGuideGeneratedAt: "2026-03-01T00:00:00.000Z", // 14 days before `now`
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(sender.sent.some((s) => s.message.body.toLowerCase().includes("groom"))).toBe(true);
    expect(repo.recordedSends).toContainEqual({
      passportId: "p1",
      kind: "grooming",
      sentAt: now.toISOString(),
    });
  });

  it("can send both a feeding and grooming reminder for the same passport in one sweep", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: 14,
        groomingGuideGeneratedAt: "2026-03-01T00:00:00.000Z",
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(repo.recordedSends).toHaveLength(2);
  });

  it("sends to every recipient's every subscription (owner and opted-in caregivers)", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [
      { userId: "owner-1", subscriptions: [subscription("owner-1", "a"), subscription("owner-1", "b")] },
      { userId: "caregiver-1", subscriptions: [subscription("caregiver-1", "c")] },
    ]);

    await runReminderSweep(repo, sender, now);

    expect(sender.sent).toHaveLength(3);
  });

  it("deletes a subscription the push service reports as expired, without failing the sweep", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    sender.nextResult = { ok: false, expired: true };
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    repo.recipients.set("p1", [{ userId: "owner-1", subscriptions: [subscription("owner-1")] }]);

    await runReminderSweep(repo, sender, now);

    expect(repo.deletedSubscriptions).toEqual([
      { userId: "owner-1", endpoint: "https://push.example.com/x" },
    ]);
  });

  it("still records the reminder as sent even if a passport currently has no subscribed recipients", async () => {
    const repo = new FakeReminderSweepRepository();
    const sender = new FakePushSender();
    repo.states = [
      {
        passportId: "p1",
        petName: "Biscuit",
        confirmedToday: false,
        lastFeedingReminderSentAt: null,
        groomingReminderIntervalDays: null,
        groomingGuideGeneratedAt: null,
        lastGroomingReminderSentAt: null,
      },
    ];
    // No recipients registered for p1 at all.

    await runReminderSweep(repo, sender, now);

    expect(sender.sent).toHaveLength(0);
    expect(repo.recordedSends).toEqual([{ passportId: "p1", kind: "feeding", sentAt: now.toISOString() }]);
  });
});
