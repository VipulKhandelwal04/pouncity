import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Exchanges the magic-link / Google OAuth code for a session, then sends the
 *  visitor on to wherever they were headed (`next`, default `/diary`). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/diary";

  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
