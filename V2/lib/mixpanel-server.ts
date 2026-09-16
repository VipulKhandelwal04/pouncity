import { randomUUID } from "crypto";
import { MIXPANEL_NAME, type ProductEvent } from "./events";

/**
 * Server-side Mixpanel forwarder. The token lives in MIXPANEL_TOKEN (server
 * env only, never NEXT_PUBLIC): events reach Mixpanel server-to-server, so ad
 * blockers can't drop them and the token never ships to the browser. Unset
 * token (local dev, previews) = silent no-op. Never throws — analytics must
 * never break a user action. `ip=0` stops Mixpanel geolocating Vercel's
 * servers as the user; no people profiles are ever sent (same privacy
 * contract as the Supabase table: distinct_id is an opaque id, no PII).
 */
export async function mixpanelTrack(
  event: ProductEvent,
  distinctId: string,
  props: Record<string, unknown> = {}
): Promise<void> {
  const token = process.env.MIXPANEL_TOKEN;
  if (!token) return;
  try {
    await fetch("https://api.mixpanel.com/track?ip=0", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/plain" },
      body: JSON.stringify([
        {
          event: MIXPANEL_NAME[event],
          properties: {
            token,
            distinct_id: distinctId,
            time: Date.now(),
            $insert_id: randomUUID(),
            ...props,
          },
        },
      ]),
    });
  } catch {
    // swallow — never block the request path on analytics
  }
}
