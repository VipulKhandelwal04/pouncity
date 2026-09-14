import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEventName, AnalyticsEventRepository } from "./analytics-event";

export class SupabaseAnalyticsEventRepository implements AnalyticsEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async record(passportId: string, eventName: AnalyticsEventName): Promise<void> {
    const { error } = await this.client
      .from("analytics_events")
      .insert({ passport_id: passportId, event_name: eventName });

    if (error) throw error;
  }
}
