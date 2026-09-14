export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  createdAt: string;
}

export interface PushSubscriptionRepository {
  /** Upserts by endpoint — resubscribing with the same endpoint replaces, not duplicates. */
  upsertForUser(userId: string, subscription: PushSubscription): Promise<PushSubscription>;
  findByUserId(userId: string): Promise<PushSubscription[]>;
  deleteByEndpoint(userId: string, endpoint: string): Promise<void>;
}
