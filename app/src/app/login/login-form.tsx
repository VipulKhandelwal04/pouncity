"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  // Where /auth/callback should send the user after sign-in — e.g. a
  // caregiver following a share link through /login gets sent back to
  // /share/[token]/join to actually complete joining, not /passport.
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  function callbackUrl() {
    const url = new URL("/auth/callback", window.location.origin);
    if (redirectTo) url.searchParams.set("next", redirectTo);
    return url.toString();
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    setStatus(error ? "error" : "sent");
  }

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
  }

  return (
    <>
      {callbackError && <p role="alert">{callbackError}</p>}

      {status === "sent" ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={sendMagicLink}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Send magic link</button>
        </form>
      )}

      {status === "error" && <p role="alert">Something went wrong. Try again.</p>}

      <button type="button" onClick={signInWithGoogle}>
        Continue with Google
      </button>
    </>
  );
}
