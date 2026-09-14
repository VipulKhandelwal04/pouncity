"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { resolveCode } from "@/lib/diary-service";

/**
 * Join a pet with a Referral code (slice 06). A public entry point equivalent to
 * opening the link: a valid code resolves to its handover token and forwards to
 * that pet's gate (`/d/[token]`), which handles sign-in / one-tap join. The code
 * is the same credential as the link, just readable aloud.
 */
export default function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = resolveCode(code);
    if (!token) {
      setError("We couldn't find a pet for that code. Check it and try again.");
      return;
    }
    router.push(`/d/${token}`);
  }

  return (
    <>
      <PublicHeader />
      <main className="app-shell" style={{ paddingTop: 20, maxWidth: 480 }}>
        <div className="card" style={{ display: "grid", gap: 16, padding: "30px 24px" }}>
          <span className="mono" style={{ color: "var(--ink-72)" }}>
            Join a pet
          </span>
          <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", lineHeight: 1.1 }}>
            Enter a care code
          </h1>
          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            An owner can share a short code to read out instead of a link. Enter it to open
            the pet you&rsquo;re helping with.
          </p>

          <form onSubmit={submit} noValidate style={{ display: "grid", gap: 10 }}>
            <label htmlFor="join-code" className="mono">
              Care code
            </label>
            <input
              id="join-code"
              className="input"
              type="text"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. A1B2-C3D4"
              aria-invalid={!!error}
              style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
            />
            {error && <div className="field-msg">{error}</div>}
            <button type="submit" className="pill" style={{ justifySelf: "start" }}>
              Open pet
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
