import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PassportReminderState,
  ReminderKind,
  ReminderRecipient,
  ReminderSweepRepository,
} from "./reminder-sweep-repository";
import type { PushSubscription } from "./push-subscription";
import { todayDateString } from "@/lib/tracking/today";

/**
 * Reminder relevance never looks back further than the longest reminder
 * interval currently offered (grooming caps at 28 days for cats — see
 * placeholder-grooming-guide-generator.ts). Bounding the reminder_sends
 * read to this window keeps sweep cost independent of how long the app
 * has been running, since that table is append-only and otherwise grows
 * without bound.
 */
const REMINDER_LOOKBACK_DAYS = 35;

function lookbackCutoffIso(): string {
  return new Date(Date.now() - REMINDER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function toPushSubscription(row: {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
}): PushSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dhKey: row.p256dh_key,
    authKey: row.auth_key,
    createdAt: row.created_at,
  };
}

/**
 * Runs against the service-role client — cross-user reads that RLS would
 * otherwise block. Fetches whole tables and joins in JS rather than
 * writing raw SQL, matching this codebase's existing style; at pilot
 * scale (a handful of users/passports) this is not a performance concern.
 * Revisit with real SQL joins if the pilot's user count grows enough for
 * it to matter.
 */
export class SupabaseReminderSweepRepository implements ReminderSweepRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAllPassportReminderStates(): Promise<PassportReminderState[]> {
    const today = todayDateString();

    const [passports, todaysEntries, allSends, guides] = await Promise.all([
      this.client.from("passports").select("id, name"),
      this.client.from("tracking_entries").select("passport_id").eq("entry_date", today),
      this.client
        .from("reminder_sends")
        .select("passport_id, kind, sent_at")
        .gte("sent_at", lookbackCutoffIso()),
      this.client.from("grooming_guides").select("passport_id, reminder_interval_days, generated_at"),
    ]);

    for (const result of [passports, todaysEntries, allSends, guides]) {
      if (result.error) throw result.error;
    }

    const confirmedTodayIds = new Set(
      (todaysEntries.data as { passport_id: string }[]).map((row) => row.passport_id),
    );

    const lastSentByPassportAndKind = new Map<string, string>();
    for (const row of allSends.data as { passport_id: string; kind: ReminderKind; sent_at: string }[]) {
      const key = `${row.passport_id}:${row.kind}`;
      const existing = lastSentByPassportAndKind.get(key);
      if (!existing || row.sent_at > existing) {
        lastSentByPassportAndKind.set(key, row.sent_at);
      }
    }

    const guideByPassport = new Map(
      (
        guides.data as {
          passport_id: string;
          reminder_interval_days: number;
          generated_at: string;
        }[]
      ).map((row) => [row.passport_id, row]),
    );

    return (passports.data as { id: string; name: string }[]).map((passport) => {
      const guide = guideByPassport.get(passport.id) ?? null;

      return {
        passportId: passport.id,
        petName: passport.name,
        confirmedToday: confirmedTodayIds.has(passport.id),
        lastFeedingReminderSentAt:
          lastSentByPassportAndKind.get(`${passport.id}:feeding`) ?? null,
        groomingReminderIntervalDays: guide?.reminder_interval_days ?? null,
        groomingGuideGeneratedAt: guide?.generated_at ?? null,
        lastGroomingReminderSentAt:
          lastSentByPassportAndKind.get(`${passport.id}:grooming`) ?? null,
      };
    });
  }

  async findRecipientsForPassport(passportId: string): Promise<ReminderRecipient[]> {
    const { data: passport, error: passportError } = await this.client
      .from("passports")
      .select("owner_id")
      .eq("id", passportId)
      .single();
    if (passportError) throw passportError;

    const { data: caregivers, error: caregiverError } = await this.client
      .from("passport_caregivers")
      .select("user_id")
      .eq("passport_id", passportId)
      .eq("wants_reminders", true);
    if (caregiverError) throw caregiverError;

    const recipientUserIds = [
      passport.owner_id as string,
      ...(caregivers as { user_id: string }[]).map((row) => row.user_id),
    ];

    const { data: subscriptions, error: subscriptionsError } = await this.client
      .from("push_subscriptions")
      .select()
      .in("user_id", recipientUserIds);
    if (subscriptionsError) throw subscriptionsError;

    const subscriptionsByUser = new Map<string, PushSubscription[]>();
    for (const row of subscriptions as Parameters<typeof toPushSubscription>[0][]) {
      const list = subscriptionsByUser.get(row.user_id) ?? [];
      list.push(toPushSubscription(row));
      subscriptionsByUser.set(row.user_id, list);
    }

    return recipientUserIds.map((userId) => ({
      userId,
      subscriptions: subscriptionsByUser.get(userId) ?? [],
    }));
  }

  async recordReminderSent(passportId: string, kind: ReminderKind, sentAt: string): Promise<void> {
    const { error } = await this.client
      .from("reminder_sends")
      .insert({ passport_id: passportId, kind, sent_at: sentAt });
    if (error) throw error;
  }

  async deleteSubscription(userId: string, endpoint: string): Promise<void> {
    const { error } = await this.client
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
    if (error) throw error;
  }
}
