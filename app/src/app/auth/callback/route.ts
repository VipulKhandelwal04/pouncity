import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Only allow a same-origin relative path, e.g. "/share/abc/join" — never
// "//evil.com" (protocol-relative) or an absolute URL, which would turn
// this into an open redirect.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/passport";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Your sign-in link is invalid or has expired. Please request a new one.")}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
