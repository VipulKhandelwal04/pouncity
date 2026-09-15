"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import {
  resolveHandoverGate,
  getAccount,
  roleOnDiary,
  diaryCaregiver,
  signIn,
  setAccountName,
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
 * - Signed out → an inline passwordless sign-in (email, then name for a new
 *   account) that binds them and lands them on the caregiver view.
 *
 * IMPORTANT: getAccount() is called ALONE (no signIn fallback) — a public route
 * must not mint an account for an anonymous visitor. And the signed-out flow
 * captures the visitor's OWN email inline: routing through the static /sign-in
 * (which mints the owner email) would collapse the caregiver into the owner
 * account. (Deliberate deviation from the ticket's "reuse /sign-in" wording —
 * the mock static page can't feed a distinct identity into the seam.)
 */
type GateStatus = "loading" | "gate" | "invalid" | "taken";
type Mode = "view" | "email" | "name";

export default function HandoverGate() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token ?? "";
  const [status, setStatus] = useState<GateStatus>("loading");
  const [target, setTarget] = useState<HandoverTarget | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = resolveHandoverGate(token);
    if (!t) {
      setStatus("invalid");
      return;
    }
    const acct = getAccount(); // no signIn fallback — anonymous stays anonymous
    if (acct) {
      const role = roleOnDiary(t.diaryId);
      if (role === "owner") {
        router.replace("/diary");
        return;
      }
      if (role === "caregiver") {
        router.replace(`/care/${t.diaryId}`);
        return;
      }
    }
    // 1:1 (ADR-0007): the spot is taken if someone else already cares for this
    // pet. The owner + this pet's caregiver were already redirected above, so any
    // caregiver here is a different person — this visitor can't join yet.
    if (diaryCaregiver(t.diaryId)) {
      setTarget(t);
      setStatus("taken");
      return;
    }
    setTarget(t);
    setAccount(acct);
    setStatus("gate");
  }, [token, router]);

  const petName = target?.petName ?? "";

  /** Bind (unless owner) and go where the resulting role belongs. */
  function finishJoin() {
    if (!target) return;
    // Owner → no-op; existing caregiver of this pet → idempotent. A non-member
    // only binds if the single caregiver spot is still open (ADR-0007).
    if (roleOnDiary(target.diaryId) === null) {
      if (!joinAsCaregiver(token)) {
        setStatus("taken"); // someone claimed the spot first
        return;
      }
    }
    const role = roleOnDiary(target.diaryId);
    router.replace(role === "owner" ? "/diary" : `/care/${target.diaryId}`);
  }

  function oneTap() {
    finishJoin();
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError("Enter a valid email.");
      return;
    }
    const acct = signIn(clean); // distinct email → distinct account (reattaches if returning)
    setError(null);
    if (!acct.name) {
      setMode("name"); // new account — capture a display name next
      return;
    }
    finishJoin(); // returning account already named → straight to help
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError("Add your name so the owner knows who's helping.");
      return;
    }
    setAccountName(clean);
    setError(null);
    finishJoin();
  }

  function switchIdentity() {
    signOut();
    setAccount(null);
    setMode("view");
  }

  if (status === "loading") {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
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
          <span className="mono" style={{ color: "var(--ink-72)" }}>
            You&rsquo;ve been invited to help
          </span>

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
          ) : mode === "view" ? (
            <>
              <button
                className="pill"
                onClick={() => setMode("email")}
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
          ) : mode === "email" ? (
            <form onSubmit={submitEmail} noValidate style={{ display: "grid", gap: 10, marginTop: 4 }}>
              <label htmlFor="join-email" className="mono">
                Your email
              </label>
              <input
                id="join-email"
                className="input"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@email.com"
                aria-invalid={!!error}
                aria-describedby={error ? "join-email-error" : undefined}
              />
              {error && (
                <div id="join-email-error" className="field-msg" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="pill" style={{ justifySelf: "start" }}>
                Continue
              </button>
              <span className="hint">
                No password. We just link {petName}&rsquo;s care to you.
              </span>
            </form>
          ) : (
            /* mode === "name" — new account only */
            <form onSubmit={submitName} noValidate style={{ display: "grid", gap: 10, marginTop: 4 }}>
              <label htmlFor="join-name" className="mono">
                Your name
              </label>
              <input
                id="join-name"
                className="input"
                type="text"
                autoComplete="given-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Alex"
                aria-invalid={!!error}
                aria-describedby={error ? "join-name-error" : undefined}
              />
              {error && (
                <div id="join-name-error" className="field-msg" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="pill" style={{ justifySelf: "start" }}>
                Start helping
              </button>
              <span className="hint">
                So {petName}&rsquo;s owner sees who logged each feed.
              </span>
            </form>
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
