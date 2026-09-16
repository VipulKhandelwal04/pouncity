"use client";

import { BrandLoader } from "@/components/BrandLoader";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { getAccount, setAccountName, hasDiary } from "@/lib/diary-service";

export default function WelcomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}

function Welcome() {
  const router = useRouter();
  const params = useSearchParams();
  // A Caregiver arriving via the Handover gate passes `next` back to it once
  // named; an Owner has no `next` and falls through to the diary/create split.
  const next = params.get("next");
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const acct = await getAccount();
      if (!acct) {
        router.replace(
          "/sign-in?next=" + encodeURIComponent(next ? `/diary/welcome?next=${next}` : "/diary/welcome")
        );
        return;
      }
      if (acct.name) {
        // Name already captured — nothing to do here; go where they belong.
        router.replace(next || ((await hasDiary()) ? "/diary" : "/diary/create"));
        return;
      }
      setReady(true);
    }
    run();
  }, [router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError("A first name is enough.");
      return;
    }
    await setAccountName(clean);
    // New accounts have no pet yet → onboard; a migrated owner keeps their pet.
    router.replace(next || ((await hasDiary()) ? "/diary" : "/diary/create"));
  }

  if (!ready) {
    return <BrandLoader />;
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
          {error && (
            <div className="field-msg" role="alert">
              {error}
            </div>
          )}
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
