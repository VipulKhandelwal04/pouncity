import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BELIEFS, EVENT_BELIEF, type AnalyticsEvent, type BeliefKey } from "@/lib/beliefs";

/**
 * Ticket 11: the team-facing pilot report. Maps each of the five events to one
 * of the four belief statements with counts, so the team can see what the pilot
 * proved. Read via the service role (analytics_event has no cross-user SELECT);
 * gated by CRON_SECRET, the team-held secret. Not a user-facing screen.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data } = await admin.from("analytics_event").select("name");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.name] = (counts[row.name] ?? 0) + 1;

  const report = Object.fromEntries(
    (Object.keys(BELIEFS) as BeliefKey[]).map((k) => [
      k,
      { statement: BELIEFS[k], events: {} as Record<string, number>, total: 0 },
    ])
  ) as Record<BeliefKey, { statement: string; events: Record<string, number>; total: number }>;

  for (const ev of Object.keys(EVENT_BELIEF) as AnalyticsEvent[]) {
    const belief = EVENT_BELIEF[ev];
    const c = counts[ev] ?? 0;
    report[belief].events[ev] = c;
    report[belief].total += c;
  }

  return NextResponse.json({ totalEvents: (data ?? []).length, beliefs: report });
}
