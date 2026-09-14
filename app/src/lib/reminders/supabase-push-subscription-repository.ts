import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushSubscription, PushSubscriptionRepository } from "./push-subscription";

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
}

function toPushSubscription(row: PushSubscriptionRow): PushSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dhKey: row.p256dh_key,
    authKey: row.auth_key,
    createdAt: row.created_at,
  };
}

export class SupabasePushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertForUser(userId: string, subscription: PushSubscription): Promise<PushSubscription> {
    const { data, error } = await this.client
      .from("push_subscriptions")
      .upsert(
        {
          id: subscription.id,
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.p256dhKey,
          auth_key: subscription.authKey,
          created_at: subscription.createdAt,
        },
        { onConflict: "user_id,endpoint" },
      )
      .select()
      .single();

    if (error) throw error;
    return toPushSubscription(data as PushSubscriptionRow);
  }

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    const { data, error } = await this.client
      .from("push_subscriptions")
      .select()
      .eq("user_id", userId);

    if (error) throw error;
    return (data as PushSubscriptionRow[]).map(toPushSubscription);
  }

  async deleteByEndpoint(userId: string, endpoint: string): Promise<void> {
    const { error } = await this.client
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    if (error) throw error;
  }
}
