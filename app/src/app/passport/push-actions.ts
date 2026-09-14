"use server";

import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePushSubscriptionRepository } from "@/lib/reminders/supabase-push-subscription-repository";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/reminders/push-subscription-service";

export async function subscribeToPushAction(subscription: unknown) {
  const { supabase, user } = await requireUser();

  const repo = new SupabasePushSubscriptionRepository(supabase);
  await subscribeToPush(user.id, subscription, repo);
}

export async function unsubscribeFromPushAction(endpoint: string) {
  const { supabase, user } = await requireUser();

  const repo = new SupabasePushSubscriptionRepository(supabase);
  await unsubscribeFromPush(user.id, endpoint, repo);
}
