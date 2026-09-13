import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

/**
 * Fetches the current authenticated user for a Server Component or Server
 * Action, redirecting to /login if there isn't one. Centralizes the guard so
 * it can't drift between call sites.
 */
export async function requireUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}
