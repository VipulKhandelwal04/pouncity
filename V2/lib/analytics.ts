import { supabaseBrowser } from "./supabase/client";
import { EVENT_BELIEF } from "./beliefs";
import type { ClientProductEvent } from "./events";

/**
 * The analytics seam (ticket 11) — deliberately separate from diary-service,
 * because it is cross-cutting. Client-side; every event mirrors to Mixpanel
 * through the first-party /api/track relay, and the five belief events also
 * land in the Supabase analytics_event table as the signed-in person, tagged
 * with the belief they test. NEVER throws: analytics must never break a user
 * action. `daily_feeding_tap` dedupes to once per Diary per day (both
 * destinations sit behind the same guard). (`signed_in` and `handover_opened`
 * are recorded server-side — the auth callback and the public /api/handover
 * route — since the client can't be trusted for one and the recipient may be
 * anonymous for the other.)
 */
export async function track(
  name: ClientProductEvent,
  opts: { diaryId?: string; props?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    const supabase = supabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
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

    // Mixpanel mirror, fire-and-forget: the relay reads identity from the
    // session cookie, so the body carries only the event itself.
    void fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, diaryId: opts.diaryId, props: opts.props }),
    }).catch(() => {});

    // Belief events also land in the Supabase pilot table.
    if (name in EVENT_BELIEF) {
      await supabase.from("analytics_event").insert({
        name,
        belief: EVENT_BELIEF[name as keyof typeof EVENT_BELIEF],
        account_id: user.id,
        diary_id: opts.diaryId ?? null,
        props: opts.props ?? null,
      });
    }
  } catch {
    // swallow — analytics must never break the app
  }
}
