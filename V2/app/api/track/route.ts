import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { mixpanelTrack } from "@/lib/mixpanel-server";
import { CLIENT_EVENTS, type ClientProductEvent } from "@/lib/events";

/**
 * First-party relay for product analytics (Mixpanel). The client posts a
 * snake_case event name; identity comes from the session cookie — never the
 * request body — so events can't be attributed to someone else, and only the
 * CLIENT_EVENTS allowlist is accepted (server-recorded events can't be
 * forged). Same-origin path + server-side forward keeps the token off the
 * client and the beacon past ad blockers. Always 204: analytics failures are
 * invisible to the product.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const name = body?.name as ClientProductEvent | undefined;
    if (!name || !CLIENT_EVENTS.includes(name)) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse(null, { status: 204 });

    // Shallow, primitive-only props — nothing nested or executable rides
    // through, and diary_id keeps Mixpanel's naming (snake_case props).
    const props: Record<string, unknown> = {};
    if (typeof body.diaryId === "string") props.diary_id = body.diaryId;
    if (body.props && typeof body.props === "object" && !Array.isArray(body.props)) {
      for (const [k, v] of Object.entries(body.props as Record<string, unknown>)) {
        const t = typeof v;
        if (t === "string" || t === "number" || t === "boolean") props[k] = v;
      }
    }

    await mixpanelTrack(name, userId, props);
  } catch {
    // swallow — analytics must never surface an error to the app
  }
  return new NextResponse(null, { status: 204 });
}
