"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { DiaryForm } from "@/components/DiaryForm";
import { getAccount, hasDiary } from "@/lib/diary-service";

export default function CreatePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function run() {
      const acct = await getAccount();
      if (!acct) {
        router.replace("/sign-in?next=" + encodeURIComponent("/diary/create"));
        return;
      }
      if (!acct.name) {
        router.replace("/diary/welcome"); // capture a name before onboarding a pet
        return;
      }
      if (await hasDiary()) {
        router.replace("/diary"); // already has a diary — no re-onboarding
        return;
      }
      setReady(true);
    }
    run();
  }, [router]);

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
        Start your pet&rsquo;s diary
      </h1>
      <p style={{ textAlign: "center", color: "var(--ink-72)", marginBottom: 26 }}>
        Just the basics now: quirks, vet and plans can come later.
      </p>
      <DiaryForm mode="create" />
    </main>
  );
}
