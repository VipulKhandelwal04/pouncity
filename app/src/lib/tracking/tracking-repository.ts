import type { TrackingEntry } from "./tracking-entry";

export interface TrackingRepository {
  findByPassportIdAndDate(passportId: string, date: string): Promise<TrackingEntry | null>;
  /** Creates or replaces the single entry for that passport+date. */
  upsertForDate(passportId: string, entry: TrackingEntry): Promise<TrackingEntry>;
  /** All entries for a passport, most recent date first. */
  findByPassportId(passportId: string): Promise<TrackingEntry[]>;
}
