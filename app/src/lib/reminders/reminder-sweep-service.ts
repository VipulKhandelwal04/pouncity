import { isFeedingReminderDue, isGroomingReminderDue } from "./reminder-decision";
import type {
  PassportReminderState,
  ReminderRecipient,
  ReminderSweepRepository,
} from "./reminder-sweep-repository";
import type { PushMessage, PushSender } from "./push-sender";

function sameCalendarDay(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10);
}

async function sendToRecipients(
  recipients: ReminderRecipient[],
  message: PushMessage,
  repo: ReminderSweepRepository,
  sender: PushSender,
): Promise<void> {
  for (const recipient of recipients) {
    for (const subscription of recipient.subscriptions) {
      const result = await sender.send(subscription, message);
      if (result.expired) {
        await repo.deleteSubscription(recipient.userId, subscription.endpoint);
      }
    }
  }
}

function feedingReminderIsDue(state: PassportReminderState, now: Date): boolean {
  const alreadyRemindedToday = state.lastFeedingReminderSentAt
    ? sameCalendarDay(state.lastFeedingReminderSentAt, now.toISOString())
    : false;

  return isFeedingReminderDue({ confirmedToday: state.confirmedToday, alreadyRemindedToday });
}

function groomingReminderIsDue(state: PassportReminderState, now: Date): boolean {
  if (state.groomingReminderIntervalDays === null || state.groomingGuideGeneratedAt === null) {
    return false;
  }

  const lastReminderOrGeneratedAt = state.lastGroomingReminderSentAt ?? state.groomingGuideGeneratedAt;

  return isGroomingReminderDue({
    reminderIntervalDays: state.groomingReminderIntervalDays,
    lastReminderOrGeneratedAt,
    now,
  });
}

export async function runReminderSweep(
  repo: ReminderSweepRepository,
  sender: PushSender,
  now: Date,
): Promise<void> {
  const states = await repo.findAllPassportReminderStates();
  const nowIso = now.toISOString();

  for (const state of states) {
    const feedingDue = feedingReminderIsDue(state, now);
    const groomingDue = groomingReminderIsDue(state, now);
    if (!feedingDue && !groomingDue) continue;

    // Fetch once per passport per sweep, not once per reminder kind — both
    // kinds go to the same recipients.
    const recipients = await repo.findRecipientsForPassport(state.passportId);

    if (feedingDue) {
      await sendToRecipients(
        recipients,
        {
          title: `${state.petName} hasn't been marked fed today`,
          body: `No feeding confirmed yet for ${state.petName}. A quick tap keeps the passport current.`,
          url: "/passport",
        },
        repo,
        sender,
      );
      await repo.recordReminderSent(state.passportId, "feeding", nowIso);
    }

    if (groomingDue) {
      await sendToRecipients(
        recipients,
        {
          title: `${state.petName} is due for grooming`,
          body: `It's been a while since ${state.petName}'s last grooming reminder.`,
          url: "/passport",
        },
        repo,
        sender,
      );
      await repo.recordReminderSent(state.passportId, "grooming", nowIso);
    }
  }
}
