export interface TrackingEntry {
  id: string;
  passportId: string;
  /** ISO date (YYYY-MM-DD), one entry per passport per date. */
  date: string;
  note: string | null;
  confirmedAt: string;
}
