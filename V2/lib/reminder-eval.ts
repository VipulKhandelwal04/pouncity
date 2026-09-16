/**
 * Reminder evaluation (ticket 10). Pure + dependency-free so it can be unit
 * tested separately from delivery. The scheduler gathers each Diary's state,
 * calls this to decide what to send, then does the Web Push send elsewhere.
 *
 *  - Feeding: reminder on AND no confirm logged for today.
 *  - Grooming: reminder on AND today falls on the guide's cadence (a whole number
 *    of `frequencyWeeks` after the guide was created). A daily cron catches each
 *    cadence day. There is no "groomed" event to anchor to, so the guide's own
 *    creation date is the anchor.
 */

export interface ReminderEvalInput {
  feedingEnabled: boolean;
  fedToday: boolean;
  groomingEnabled: boolean;
  /** The grooming guide's recommended cadence in weeks; 0 = no guide/cadence. */
  frequencyWeeks: number;
  /** ISO timestamp the current grooming guide was created (cadence anchor), or null. */
  guideCreatedAt: string | null;
  /** The day the scheduler runs (ISO date or timestamp). */
  now: string;
}

export interface ReminderEvalResult {
  feeding: boolean;
  grooming: boolean;
}

const DAY_MS = 86_400_000;

export function evaluateReminders(input: ReminderEvalInput): ReminderEvalResult {
  const feeding = input.feedingEnabled && !input.fedToday;

  let grooming = false;
  if (input.groomingEnabled && input.frequencyWeeks > 0 && input.guideCreatedAt) {
    // Compare calendar days (truncate to yyyy-mm-dd) so time-of-day never shifts
    // the cadence by a day.
    const created = Date.parse(input.guideCreatedAt.slice(0, 10));
    const today = Date.parse(input.now.slice(0, 10));
    if (Number.isFinite(created) && Number.isFinite(today) && today > created) {
      const days = Math.round((today - created) / DAY_MS);
      const cadenceDays = input.frequencyWeeks * 7;
      grooming = days > 0 && days % cadenceDays === 0;
    }
  }

  return { feeding, grooming };
}
