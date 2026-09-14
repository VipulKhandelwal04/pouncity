import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role-client";
import { SupabaseReminderSweepRepository } from "@/lib/reminders/supabase-reminder-sweep-repository";
import { WebPushSender } from "@/lib/reminders/web-push-sender";
import { runReminderSweep } from "@/lib/reminders/reminder-sweep-service";
import { cronSecret } from "@/lib/supabase/service-role-env";
import { timingSafeEqualStrings } from "@/lib/supabase/timing-safe-equal-strings";

// Intended to be triggered by an external scheduler (e.g. Vercel Cron)
// hitting this route with the shared secret — not wired up to an actual
// schedule yet, since this app isn't deployed anywhere. See SETUP.md.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!timingSafeEqualStrings(authHeader, `Bearer ${cronSecret()}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createSupabaseServiceRoleClient();
  const repo = new SupabaseReminderSweepRepository(client);
  const sender = new WebPushSender();

  await runReminderSweep(repo, sender, new Date());

  return NextResponse.json({ ok: true });
}
