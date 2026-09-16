import { supabaseBrowser } from "./supabase/client";
import { EVENT_BELIEF, type AnalyticsEvent } from "./beliefs";

/**
 * The analytics seam (ticket 11) — deliberately separate from diary-service,
 * because it is cross-cutting. Client-side; records one analytics_event as the
 * signed-in person, tagged with the belief the event tests. NEVER throws:
 * analytics must never break a user action. `daily_feeding_tap` dedupes to once
 * per Diary per day. (`handover_opened` is recorded server-side by the public
 * /api/handover route, since the recipient may be anonymous.)
 */
export async function track(
  name: Exclude<AnalyticsEvent, "handover_opened">,
  opts: { diaryId?: string; props?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (name === "daily_feeding_tap" && opts.diaryId) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("analytics_event")
        .select("id", { count: "exact", head: true })
        .eq("name", "daily_feeding_tap")
        .eq("diary_id", opts.diaryId)
        .gte("created_at", start.toISOString());
      if ((count ?? 0) > 0) return; // already logged for this diary today
    }

    await supabase.from("analytics_event").insert({
      name,
      belief: EVENT_BELIEF[name],
      account_id: user.id,
      diary_id: opts.diaryId ?? null,
      props: opts.props ?? null,
    });
  } catch {
    // swallow — analytics must never break the app
  }
}
