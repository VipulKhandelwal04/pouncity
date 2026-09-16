import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { evaluateReminders } from "@/lib/reminder-eval";

/**
 * Ticket 10: the scheduled reminder job (Vercel Cron -> GET this route daily).
 * Reads reminder prefs + subscriptions via the service role, decides what's due
 * with the pure evaluator, and sends Web Push. Expired endpoints (404/410) are
 * deleted. Authorized by CRON_SECRET (Vercel sends it as a bearer token).
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    return NextResponse.json({ error: "vapid_not_configured" }, { status: 503 });
  }
  webpush.setVapidDetails(subject, pub, priv);

  const admin = supabaseAdmin();
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const { data: prefs } = await admin
    .from("reminder_pref")
    .select("account_id,diary_id,feeding_enabled,grooming_enabled")
    .or("feeding_enabled.eq.true,grooming_enabled.eq.true");

  let evaluated = 0;
  let sent = 0;
  let cleaned = 0;

  for (const p of prefs ?? []) {
    evaluated++;

    const { count: fedCount } = await admin
      .from("feeding_entry")
      .select("id", { count: "exact", head: true })
      .eq("diary_id", p.diary_id)
      .eq("fed_on", today);

    const { data: gg } = await admin
      .from("grooming_guide")
      .select("frequency_weeks,created_at")
      .eq("diary_id", p.diary_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const due = evaluateReminders({
      feedingEnabled: p.feeding_enabled,
      fedToday: (fedCount ?? 0) > 0,
      groomingEnabled: p.grooming_enabled,
      frequencyWeeks: gg?.frequency_weeks ?? 0,
      guideCreatedAt: gg?.created_at ?? null,
      now: nowIso,
    });
    if (!due.feeding && !due.grooming) continue;

    const { data: diary } = await admin
      .from("diary")
      .select("name")
      .eq("id", p.diary_id)
      .maybeSingle();
    const petName = diary?.name ?? "your pet";

    const messages: { title: string; body: string; url: string }[] = [];
    if (due.feeding) {
      messages.push({ title: `Feed ${petName}?`, body: `${petName} isn't marked fed today.`, url: "/diary" });
    }
    if (due.grooming) {
      messages.push({ title: `Grooming for ${petName}`, body: `A grooming session is due.`, url: "/diary/grooming" });
    }

    const { data: subs } = await admin
      .from("push_subscription")
      .select("id,endpoint,p256dh,auth")
      .eq("account_id", p.account_id);

    for (const sub of subs ?? []) {
      for (const msg of messages) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(msg)
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscription").delete().eq("id", sub.id);
            cleaned++;
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, evaluated, sent, cleaned });
}
