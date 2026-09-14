import { describe, expect, it } from "vitest";
import { subscribeToPush, unsubscribeFromPush } from "./push-subscription-service";
import type { PushSubscriptionRepository, PushSubscription } from "./push-subscription";

class InMemoryPushSubscriptionRepository implements PushSubscriptionRepository {
  private subs = new Map<string, PushSubscription>();

  private key(userId: string, endpoint: string) {
    return `${userId}:${endpoint}`;
  }

  async upsertForUser(userId: string, subscription: PushSubscription): Promise<PushSubscription> {
    this.subs.set(this.key(userId, subscription.endpoint), subscription);
    return subscription;
  }

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    return [...this.subs.values()].filter((s) => s.userId === userId);
  }

  async deleteByEndpoint(userId: string, endpoint: string): Promise<void> {
    this.subs.delete(this.key(userId, endpoint));
  }
}

const validSubscription = {
  endpoint: "https://push.example.com/abc123",
  keys: { p256dh: "p256dh-key-value", auth: "auth-key-value" },
};

describe("subscribeToPush", () => {
  it("stores a valid subscription for the user", async () => {
    const repo = new InMemoryPushSubscriptionRepository();

    await subscribeToPush("user-1", validSubscription, repo);

    const found = await repo.findByUserId("user-1");
    expect(found).toHaveLength(1);
    expect(found[0].endpoint).toBe(validSubscription.endpoint);
  });

  it("resubscribing with the same endpoint replaces rather than duplicates", async () => {
    const repo = new InMemoryPushSubscriptionRepository();

    await subscribeToPush("user-1", validSubscription, repo);
    await subscribeToPush("user-1", validSubscription, repo);

    const found = await repo.findByUserId("user-1");
    expect(found).toHaveLength(1);
  });

  it("rejects a subscription missing the endpoint", async () => {
    const repo = new InMemoryPushSubscriptionRepository();
    const invalid = { ...validSubscription, endpoint: "" };

    await expect(subscribeToPush("user-1", invalid, repo)).rejects.toThrow();
  });

  it("rejects a subscription missing keys", async () => {
    const repo = new InMemoryPushSubscriptionRepository();
    const invalid = { endpoint: validSubscription.endpoint, keys: { p256dh: "", auth: "" } };

    await expect(subscribeToPush("user-1", invalid, repo)).rejects.toThrow();
  });
});

describe("unsubscribeFromPush", () => {
  it("removes the subscription for that endpoint", async () => {
    const repo = new InMemoryPushSubscriptionRepository();
    await subscribeToPush("user-1", validSubscription, repo);

    await unsubscribeFromPush("user-1", validSubscription.endpoint, repo);

    const found = await repo.findByUserId("user-1");
    expect(found).toHaveLength(0);
  });

  it("is safe to call when there was never a subscription", async () => {
    const repo = new InMemoryPushSubscriptionRepository();

    await expect(
      unsubscribeFromPush("user-1", "https://never-subscribed.example.com", repo),
    ).resolves.not.toThrow();
  });
});
