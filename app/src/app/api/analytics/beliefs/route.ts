import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import { analyticsSecret } from "@/lib/supabase/service-role-env";
import { timingSafeEqualStrings } from "@/lib/supabase/timing-safe-equal-strings";
import { aggregateEventCounts, type AnalyticsEventRow } from "@/lib/analytics/aggregate-event-counts";
import { buildBeliefReport } from "@/lib/analytics/belief-report";

// Cross-user aggregate read — same reasoning as the cron route's
// service_role use (see SETUP.md): belief validation needs cohort-wide
// counts, not one user's own data, which RLS is designed to prevent.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!timingSafeEqualStrings(authHeader, `Bearer ${analyticsSecret()}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createSupabaseServiceRoleClient();
  const { data, error } = await client.from("analytics_events").select("passport_id, event_name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = aggregateEventCounts(data as AnalyticsEventRow[]);
  const report = buildBeliefReport(counts);

  return NextResponse.json(report);
}
