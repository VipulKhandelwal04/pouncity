"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { signInWithGoogle } from "@/lib/diary-service";

/**
 * The one real sign-in page for the whole app (ADR-0004: Access requires an
 * Account). Every entry point that needs a session — the owner flows and the
 * Handover gate alike — redirects here with `?next=` and comes back once
 * signed in. A shared page is correct now that sign-in is real: each visitor
 * authenticates as themselves, so there's no risk of collapsing a caregiver
 * into a mocked owner identity the way the old hardcoded `you@pouncity.app`
 * flow would have.
 *
 * PILOT: Google is the only way in. Email (magic link / one-time code) is
 * intentionally not offered here because Resend has no verified sending domain
 * yet, so it cannot deliver to external addresses. The `requestMagicLink` /
 * `verifyEmailCode` seam is still in `diary-service`, so re-adding the email
 * form is a UI-only change once a sending domain is verified.
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(next);
      // On success the browser is redirected to Google, so this component
      // unmounts; no need to clear `busy`.
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

          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            Continue with your Google account. No password to remember, and
            nothing to set up.
          </p>

          <button
            type="button"
            className="pill"
            onClick={google}
            disabled={busy}
            style={{ justifySelf: "start" }}
          >
            {busy ? "Starting…" : "Continue with Google"}
          </button>

          {error && (
            <div className="field-msg" role="alert">
              {error}
            </div>
          )}

          <span className="hint">
            We only use your Google account to sign you in.
          </span>

          <p className="hint" style={{ marginTop: 4 }}>
            By continuing, you agree to our{" "}
            <a href="/terms">Terms of Use</a> and{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </>
  );
}
