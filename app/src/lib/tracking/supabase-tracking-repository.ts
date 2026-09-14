import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackingEntry } from "./tracking-entry";
import type { TrackingRepository } from "./tracking-repository";

interface TrackingEntryRow {
  id: string;
  passport_id: string;
  entry_date: string;
  note: string | null;
  confirmed_at: string;
}

function toTrackingEntry(row: TrackingEntryRow): TrackingEntry {
  return {
    id: row.id,
    passportId: row.passport_id,
    date: row.entry_date,
    note: row.note,
    confirmedAt: row.confirmed_at,
  };
}

export class SupabaseTrackingRepository implements TrackingRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByPassportIdAndDate(
    passportId: string,
    date: string,
  ): Promise<TrackingEntry | null> {
    const { data, error } = await this.client
      .from("tracking_entries")
      .select()
      .eq("passport_id", passportId)
      .eq("entry_date", date)
      .maybeSingle();

    if (error) throw error;
    return data ? toTrackingEntry(data as TrackingEntryRow) : null;
  }

  async upsertForDate(passportId: string, entry: TrackingEntry): Promise<TrackingEntry> {
    const { data, error } = await this.client
      .from("tracking_entries")
      .upsert(
        {
          id: entry.id,
          passport_id: passportId,
          entry_date: entry.date,
          note: entry.note,
          confirmed_at: entry.confirmedAt,
        },
        { onConflict: "passport_id,entry_date" },
      )
      .select()
      .single();

    if (error) throw error;
    return toTrackingEntry(data as TrackingEntryRow);
  }

  async findByPassportId(passportId: string): Promise<TrackingEntry[]> {
    const { data, error } = await this.client
      .from("tracking_entries")
      .select()
      .eq("passport_id", passportId)
      .order("entry_date", { ascending: false });

    if (error) throw error;
    return (data as TrackingEntryRow[]).map(toTrackingEntry);
  }
}
