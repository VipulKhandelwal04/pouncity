const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isFeedingReminderDue(params: {
  confirmedToday: boolean;
  alreadyRemindedToday: boolean;
}): boolean {
  return !params.confirmedToday && !params.alreadyRemindedToday;
}

export function isGroomingReminderDue(params: {
  reminderIntervalDays: number;
  /** ISO timestamp of the last grooming reminder sent, or the guide's
   * generatedAt if none has been sent yet. */
  lastReminderOrGeneratedAt: string;
  now: Date;
}): boolean {
  const daysSince =
    (params.now.getTime() - new Date(params.lastReminderOrGeneratedAt).getTime()) / MS_PER_DAY;

  return daysSince >= params.reminderIntervalDays;
}
