"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { requestMagicLink, signInWithGoogle, verifyEmailCode } from "@/lib/diary-service";

/**
 * The one real sign-in page for the whole app (ADR-0004: Access requires an
 * Account). Every entry point that needs a session — the owner flows and the
 * Handover gate alike — redirects here with `?next=` and comes back once
 * signed in. A shared page is correct now that sign-in is real: each visitor
 * authenticates as themselves, so there's no risk of collapsing a caregiver
 * into a mocked owner identity the way the old hardcoded `you@pouncity.app`
 * flow would have.
 */
export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const params = useSearchParams();
  const nextParam = params.get("next") || "/diary";
  // `next` comes from the URL; only follow same-origin absolute paths so the
  // sign-in redirect can't be turned into an open redirect.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/diary";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestMagicLink(clean, next);
      setSent(true);
    } catch {
      setError("Couldn't send the link. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(email, clean);
      // Hard navigation (not router.push) so middleware runs against the
      // freshly written session cookie and the destination renders signed in
      // on first paint.
      window.location.assign(next);
    } catch {
      setError("That code didn't work — it may have expired. Resend to get a new one.");
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    setCode("");
    try {
      await requestMagicLink(email, next);
    } catch {
      setError("Couldn't resend the code. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      await signInWithGoogle(next);
    } catch {
      setError("Couldn't start Google sign-in. Try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="app-shell" style={{ paddingTop: 20, maxWidth: 480 }}>
        <div className="card" style={{ display: "grid", gap: 16, padding: "30px 24px" }}>
          <span className="mono" style={{ color: "var(--ink-72)" }}>
            Sign in
          </span>
          <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", lineHeight: 1.1 }}>
            Welcome to Pouncity
          </h1>

          {sent ? (
            <div style={{ display: "grid", gap: 16 }}>
              <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
                We emailed <strong>{email}</strong>. Tap the link in it, or enter the
                6-digit code below — either one signs you in.
              </p>

              <form onSubmit={submitCode} noValidate style={{ display: "grid", gap: 10 }}>
                <label htmlFor="signin-code" className="mono">
                  Code from the email
                </label>
                <input
                  id="signin-code"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError(null);
                  }}
                  placeholder="123456"
                  aria-invalid={!!error}
                  aria-describedby={error ? "signin-code-error" : undefined}
                  disabled={busy}
                />
                {error && (
                  <div id="signin-code-error" className="field-msg" role="alert">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="pill"
                  style={{ justifySelf: "start" }}
                  disabled={busy || code.length < 6}
                >
                  {busy ? "Verifying…" : "Verify & sign in"}
                </button>
              </form>

              <button
                type="button"
                className="pill pill--ghost"
                onClick={resend}
                disabled={busy}
                style={{ justifySelf: "start" }}
              >
                Resend code
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="pill pill--ghost"
                onClick={google}
                disabled={busy}
                style={{ justifySelf: "start" }}
              >
                Continue with Google
              </button>

              <span className="hint">or</span>

              <form onSubmit={submitEmail} noValidate style={{ display: "grid", gap: 10 }}>
                <label htmlFor="signin-email" className="mono">
                  Your email
                </label>
                <input
                  id="signin-email"
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
                  aria-describedby={error ? "signin-email-error" : undefined}
                  disabled={busy}
                />
                {error && (
                  <div id="signin-email-error" className="field-msg" role="alert">
                    {error}
                  </div>
                )}
                <button type="submit" className="pill" style={{ justifySelf: "start" }} disabled={busy}>
                  {busy ? "Sending…" : "Send sign-in link"}
                </button>
                <span className="hint">No password. We just email you a link.</span>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
