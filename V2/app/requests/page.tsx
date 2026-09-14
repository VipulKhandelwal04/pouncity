"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { InitialAvatar } from "@/components/CareBits";
import {
  careRequests,
  getAccount,
  getDiary,
  type Account,
  type CareRequest,
} from "@/lib/diary-service";

export default function RequestsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [petName, setPetName] = useState("your pet");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const acct = getAccount();
    if (!acct) {
      router.replace("/sign-in");
      return;
    }
    setAccount(acct);
    setRequests(careRequests());
    const d = getDiary();
    if (d) setPetName(d.name);
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  return (
    <>
      <AppHeader account={account} />
      <main className="app-shell app-shell--tabbed" style={{ paddingTop: 8 }}>
        <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", margin: "12px 0 6px" }}>
          Requests
        </h1>
        <p style={{ color: "var(--ink-72)", lineHeight: 1.55, marginBottom: 20 }}>
          Everyone you&rsquo;ve asked to help with {petName}.
        </p>

        {requests.length === 0 ? (
          <div className="card" style={{ borderStyle: "dashed" }}>
            <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", lineHeight: 1.55 }}>
              Nothing sent yet. Find someone in{" "}
              <Link href="/find-care" style={{ color: "var(--coral-text)", fontWeight: 600 }}>
                Find care
              </Link>{" "}
              and ask them to help.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/find-care/${r.providerId}`}
                className="card"
                style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px" }}
              >
                <InitialAvatar name={r.providerName} size={46} />
                <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 4 }}>
                  <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    {r.providerName}
                  </strong>
                  {r.when && (
                    <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>{r.when}</span>
                  )}
                  {r.notes && (
                    <span style={{ color: "var(--ink-72)", fontSize: "0.82rem" }}>{r.notes}</span>
                  )}
                  <span className="mono" style={{ color: "var(--ink-72)", marginTop: 2 }}>
                    Sent {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <TabBar />
    </>
  );
}
