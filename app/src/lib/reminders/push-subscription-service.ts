import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PushSubscription, PushSubscriptionRepository } from "./push-subscription";

const subscriptionInputSchema = z.object({
  endpoint: z.string().trim().min(1),
  keys: z.object({
    p256dh: z.string().trim().min(1),
    auth: z.string().trim().min(1),
  }),
});

export async function subscribeToPush(
  userId: string,
  input: unknown,
  repo: PushSubscriptionRepository,
): Promise<PushSubscription> {
  const validated = subscriptionInputSchema.parse(input);

  const subscription: PushSubscription = {
    id: randomUUID(),
    userId,
    endpoint: validated.endpoint,
    p256dhKey: validated.keys.p256dh,
    authKey: validated.keys.auth,
    createdAt: new Date().toISOString(),
  };

  return repo.upsertForUser(userId, subscription);
}

export async function unsubscribeFromPush(
  userId: string,
  endpoint: string,
  repo: PushSubscriptionRepository,
): Promise<void> {
  await repo.deleteByEndpoint(userId, endpoint);
}
