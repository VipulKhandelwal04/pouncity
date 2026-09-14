import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";
import { supabaseServiceRoleKey } from "./service-role-env";

/**
 * Bypasses RLS entirely. This is the ONE deliberate, scoped exception to
 * "never use service_role in this codebase" (see SETUP.md) — a
 * cross-user reminder sweep is a legitimate server-side batch job that
 * RLS is specifically designed to prevent a normal user session from
 * doing, and this client is only ever constructed inside the protected
 * /api/cron/send-reminders route, never reachable from any client code.
 */
export function createSupabaseServiceRoleClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey());
}
