import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. `server-only` makes any accidental
 * import from a "use client" file a build error, since this key must never
 * reach the browser. Used exclusively by the public /api/handover route
 * (ADR-0003: the one path that legitimately skips RLS, because an anonymous
 * visitor opening a link has no session to be scoped by).
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
