import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * The public Handover endpoint (ticket 04, ADR-0003) — the one capability
 * that can't exist client-side: resolving a token/code with no account and no
 * session, service-role only. It deliberately returns the pet's id + name and
 * nothing else (ADR-0004: no diary content is readable without an account) —
 * the caller signs in and reads the Diary through the normal RLS-scoped path.
 *
 * `?token=` resolves a link (and records a handover_open — this is "opening"
 * the link, so it's the one variant that logs). `?code=` resolves a typed
 * Referral code to its token; callers always follow up with a `?token=`
 * resolve (see diary-service.ts's resolveCode/resolveHandoverGate pair), so
 * logging here too would double-count the same visit.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const code = url.searchParams.get("code");
  const recipient = url.searchParams.get("recipient") || "unknown";
  const admin = supabaseAdmin();

  if (code) {
    const normalized = code.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (!normalized) return NextResponse.json({ token: null });
    const { data } = await admin
      .from("handover_token")
      .select("token")
      .eq("referral_code", normalized)
      .eq("state", "active")
      .maybeSingle();
    return NextResponse.json({ token: data?.token ?? null });
  }

  if (token) {
    const { data: row } = await admin
      .from("handover_token")
      .select("id,diary_id,state")
      .eq("token", token)
      .maybeSingle();
    if (!row || row.state !== "active") return NextResponse.json({ target: null });

    const { data: diary } = await admin
      .from("diary")
      .select("name")
      .eq("id", row.diary_id)
      .maybeSingle();
    if (!diary) return NextResponse.json({ target: null });

    await admin.from("handover_open").insert({ token_id: row.id, recipient_key: recipient });

    // Occupancy (ADR-0007: one Caregiver per pet). Reported as a bare boolean so
    // the gate/Circle can show "already taken" to a signed-out or non-owner
    // visitor — who can't read the caregiver membership under RLS — without
    // leaking who that Caregiver is. Service role, so RLS doesn't hide the count.
    const { count } = await admin
      .from("membership")
      .select("id", { count: "exact", head: true })
      .eq("diary_id", row.diary_id)
      .eq("role", "caregiver");

    return NextResponse.json({
      target: { diaryId: row.diary_id, petName: diary.name, taken: (count ?? 0) > 0 },
    });
  }

  return NextResponse.json({ error: "token or code required" }, { status: 400 });
}
