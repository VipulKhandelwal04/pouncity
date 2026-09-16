"use client";

import { BrandLoader } from "@/components/BrandLoader";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import {
  resolveHandoverGate,
  getAccount,
  roleOnDiary,
  joinAsCaregiver,
  signOut,
  type Account,
  type HandoverTarget,
} from "@/lib/diary-service";

/**
 * The handover sign-in gate + caregiver join (ADR-0004, slices 02+04). Opening a
 * link while signed out shows ONLY the pet's name and an invitation to help —
 * never any diary content — then binds the person as a Caregiver.
 *
 * - Unknown / revoked token → a calm "this diary isn't shared" state.
 * - Signed-in Owner of this diary → sent to their own diary.
 * - Signed-in Caregiver of this diary → sent to its caregiver view.
 * - Signed-in without a membership → one-tap "Help with {pet}" (no re-auth).
 * - Signed out → sent to the real /sign-in page (Google), with
 *   `next` pointing back here, and returns to finish the join.
 *
 * IMPORTANT: getAccount() is called ALONE — a public route must not mint an
 * account for an anonymous visitor. Now that /sign-in is real Supabase Auth
 * (ticket 02), each visitor authenticates as themself, so routing through the
 * shared sign-in page no longer risks collapsing a caregiver into the owner's
 * identity the way the old hardcoded mock email did.
 */
type GateStatus = "loading" | "gate" | "invalid" | "taken";

export default function HandoverGate() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token ?? "";
  const [status, setStatus] = useState<GateStatus>("loading");
  const [target, setTarget] = useState<HandoverTarget | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    async function run() {
      const t = await resolveHandoverGate(token);
      if (!t) {
        setStatus("invalid");
        return;
      }
      const acct = await getAccount(); // anonymous stays anonymous — no auto sign-in
      if (acct && !acct.name) {
        // First sign-in via the gate — capture a name, then come straight back.
        router.replace("/diary/welcome?next=" + encodeURIComponent(`/d/${token}`));
        return;
      }
      if (acct) {
        const role = await roleOnDiary(t.diaryId);
        if (role === "owner") {
          router.replace("/diary");
          return;
        }
        if (role === "caregiver") {
          router.replace(`/care/${t.diaryId}`);
          return;
        }
      }
      // 1:1 (ADR-0007): the spot is taken if someone already cares for this pet.
      // The owner + this pet's own caregiver were redirected above, so a visitor
      // still here with `taken` is a different person — they can't join yet.
      // `taken` comes from /api/handover (service role): a visitor can't read the
      // caregiver membership themselves under RLS.
      if (t.taken) {
        setTarget(t);
        setStatus("taken");
        return;
      }
      setTarget(t);
      setAccount(acct);
      setStatus("gate");
    }
    run();
  }, [token, router]);

  const petName = target?.petName ?? "";

  /** Bind (unless owner) and go where the resulting role belongs. */
  async function finishJoin() {
    if (!target) return;
    // Owner → no-op; existing caregiver of this pet → idempotent. A non-member
    // only binds if the single caregiver spot is still open (ADR-0007).
    if ((await roleOnDiary(target.diaryId)) === null) {
      if (!(await joinAsCaregiver(token))) {
        setStatus("taken"); // someone claimed the spot first
        return;
      }
    }
    const role = await roleOnDiary(target.diaryId);
    router.replace(role === "owner" ? "/diary" : `/care/${target.diaryId}`);
  }

  function oneTap() {
    finishJoin();
  }

  function signUpToHelp() {
    router.push("/sign-in?next=" + encodeURIComponent(`/d/${token}`));
  }

  async function switchIdentity() {
    await signOut();
    setAccount(null);
  }

  if (status === "loading") {
    return <BrandLoader />;
  }

  if (status === "invalid") {
    return (
      <>
        <PublicHeader />
        <main className="app-shell" style={{ paddingTop: 20 }}>
          <div
            className="card"
            style={{ borderStyle: "dashed", textAlign: "center", padding: "34px 22px" }}
          >
            <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>This diary isn&rsquo;t shared</h1>
            <p style={{ color: "var(--ink-72)" }}>
              The link may have been turned off, or it&rsquo;s not quite right. Ask the
              owner for a fresh one.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (status === "taken") {
    return (
      <>
        <PublicHeader />
        <main className="app-shell" style={{ paddingTop: 20 }}>
          <div
            className="card"
            style={{ borderStyle: "dashed", textAlign: "center", padding: "34px 22px" }}
          >
            <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
              {petName} already has a caregiver
            </h1>
            <p style={{ color: "var(--ink-72)" }}>
              Only one person helps with a pet at a time. Ask {petName}&rsquo;s owner to send a
              fresh invite when they next need a hand.
            </p>
          </div>
        </main>
      </>
    );
  }

  // status === "gate" — pet name only, zero diary content.
  return (
    <>
      <PublicHeader />
      <main className="app-shell" style={{ paddingTop: 20, maxWidth: 480 }}>
        <div className="card" style={{ display: "grid", gap: 16, padding: "30px 24px" }}>
          {/* no kicker above the heading (No Kicker Rule); the copy below carries the invitation */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <PawMark />
            <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", lineHeight: 1.1 }}>
              Help with {petName}
            </h1>
          </div>

          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            Someone shared {petName}&rsquo;s care with you. Sign in to lend a hand. You&rsquo;ll
            be able to log {petName}&rsquo;s daily feed and follow the care routine, so the
            owner always knows {petName} is looked after.
          </p>

          {account ? (
            /* signed in, not yet a caregiver — one tap, no re-auth */
            <>
              <button className="pill" onClick={oneTap} style={{ justifySelf: "start", marginTop: 4 }}>
                Help with {petName}
              </button>
              <span className="hint">
                Signed in as {account.name || account.email}.{" "}
                <button
                  type="button"
                  onClick={switchIdentity}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--coral-text)",
                    font: "inherit",
                  }}
                >
                  Not you?
                </button>
              </span>
            </>
          ) : (
            <>
              <button
                className="pill"
                onClick={signUpToHelp}
                style={{ justifySelf: "start", marginTop: 4 }}
              >
                Sign up to help
              </button>
              <span className="hint">
                You&rsquo;ll set up a quick account so {petName}&rsquo;s owner knows who&rsquo;s
                helping.{" "}
                <Link href="/diary/circle" style={{ color: "var(--coral-text)" }}>
                  Have a code instead?
                </Link>
              </span>
            </>
          )}
        </div>
      </main>
    </>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function PawMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        placeItems: "center",
        width: 52,
        height: 52,
        flex: "0 0 auto",
        borderRadius: 999,
        background: "var(--sun)",
        border: "var(--border)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="16" rx="5" ry="4" fill="var(--coral)" />
        <circle cx="6.5" cy="10" r="2.1" fill="var(--coral)" />
        <circle cx="10.3" cy="7" r="2.1" fill="var(--coral)" />
        <circle cx="14.7" cy="7" r="2.1" fill="var(--coral)" />
        <circle cx="17.5" cy="10" r="2.1" fill="var(--coral)" />
      </svg>
    </span>
  );
}
