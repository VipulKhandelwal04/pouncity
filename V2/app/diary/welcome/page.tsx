"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { getAccount, signIn, setAccountName, hasDiary } from "@/lib/diary-service";

export default function WelcomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A refresh or deep-link can land here with no account — mint the mock one
    // first so setAccountName has something to write to.
    const acct = getAccount() ?? signIn("you@pouncity.app");
    if (acct.name) {
      // Name already captured — nothing to do here; go where they belong.
      router.replace(hasDiary() ? "/diary" : "/diary/create");
      return;
    }
    setReady(true);
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError("A first name is enough.");
      return;
    }
    setAccountName(clean);
    // New accounts have no pet yet → onboard; a migrated owner keeps their pet.
    router.replace(hasDiary() ? "/diary" : "/diary/create");
  }

  if (!ready) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  return (
    <main className="app-shell" style={{ maxWidth: 480, paddingTop: 26 }}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <Wordmark />
      </div>
      <h1
        style={{
          fontSize: "clamp(1.8rem, 7vw, 2.3rem)",
          textAlign: "center",
          margin: "6px 0 6px",
        }}
      >
        What should we call you?
      </h1>
      <p style={{ textAlign: "center", color: "var(--ink-72)", marginBottom: 26 }}>
        Your name shows up next to each feeding, so anyone helping out knows who
        did what.
      </p>

      <form onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="account-name">Your name</label>
          <input
            id="account-name"
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
          />
          {error && <div className="field-msg">{error}</div>}
        </div>

        <button
          type="submit"
          className="pill"
          style={{ width: "100%", marginTop: 6 }}
        >
          Continue
        </button>
      </form>
    </main>
  );
}
