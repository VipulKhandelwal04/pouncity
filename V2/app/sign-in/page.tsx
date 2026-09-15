"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { requestMagicLink, signInWithGoogle } from "@/lib/diary-service";

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
  const next = params.get("next") || "/diary";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
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
            <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
              Check <strong>{email}</strong> for a sign-in link. You can close this tab.
            </p>
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
