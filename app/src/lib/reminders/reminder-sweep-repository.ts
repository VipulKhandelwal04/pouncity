import type { PushSubscription } from "./push-subscription";

export type ReminderKind = "feeding" | "grooming";

export interface PassportReminderState {
  passportId: string;
  petName: string;
  confirmedToday: boolean;
  lastFeedingReminderSentAt: string | null;
  /** null means there's no active grooming guide, so no grooming reminder applies. */
  groomingReminderIntervalDays: number | null;
  groomingGuideGeneratedAt: string | null;
  lastGroomingReminderSentAt: string | null;
}

export interface ReminderRecipient {
  userId: string;
  subscriptions: PushSubscription[];
}

export interface ReminderSweepRepository {
  findAllPassportReminderStates(): Promise<PassportReminderState[]>;
  /** Owner plus any caregiver with wants_reminders = true. */
  findRecipientsForPassport(passportId: string): Promise<ReminderRecipient[]>;
  recordReminderSent(passportId: string, kind: ReminderKind, sentAt: string): Promise<void>;
  deleteSubscription(userId: string, endpoint: string): Promise<void>;
}
