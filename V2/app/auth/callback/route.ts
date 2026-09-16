import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { mixpanelTrack } from "@/lib/mixpanel-server";

/** Exchanges the magic-link / Google OAuth code for a session, then sends the
 *  visitor on to wherever they were headed (`next`, default `/diary`). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // `next` is attacker-controllable (it rides in the emailed link), so only
  // follow same-origin destinations — otherwise the callback becomes an open
  // redirect. A bare prefix check is not enough: `//evil.com` and backslash
  // variants like `/\evil.com` both resolve to another host, so resolve the
  // value and compare origins.
  const next = safeNext(url.searchParams.get("next"), url.origin);

  if (code) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // Server-recorded on purpose: the one reliable "a session began" moment
    // (mixpanelTrack never throws, so the redirect is never blocked).
    if (data?.user) await mixpanelTrack("signed_in", data.user.id);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

/** Returns a same-origin path (+query/hash) from an untrusted `next`, or
 *  `/diary` when it's missing, malformed, or points at another origin. */
function safeNext(raw: string | null, origin: string): string {
  const fallback = "/diary";
  if (!raw) return fallback;
  try {
    const dest = new URL(raw, origin);
    if (dest.origin !== origin) return fallback;
    return dest.pathname + dest.search + dest.hash;
  } catch {
    return fallback;
  }
}
