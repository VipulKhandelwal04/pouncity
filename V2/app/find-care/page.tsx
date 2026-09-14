"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { Badge, InitialAvatar } from "@/components/CareBits";
import {
  getAccount,
  getDiary,
  findCareList,
  type Account,
  type CareProvider,
} from "@/lib/diary-service";

type Filter = "all" | "circle" | "verified";

export default function FindCarePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [providers, setProviders] = useState<CareProvider[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [petName, setPetName] = useState("your pet");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const acct = getAccount();
    if (!acct) {
      router.replace("/sign-in");
      return;
    }
    setAccount(acct);
    setProviders(findCareList());
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

  const circleCount = providers.filter((p) => p.kind === "circle").length;
  const shown = providers.filter((p) => filter === "all" || p.kind === filter);

  return (
    <>
      <AppHeader account={account} />
      <main className="app-shell app-shell--tabbed" style={{ paddingTop: 8 }}>
        <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", margin: "12px 0 6px" }}>
          Find care
        </h1>
        <p style={{ color: "var(--ink-72)", lineHeight: 1.55, marginBottom: 20 }}>
          Your circle and a directory of verified sitters near you, in one list — for{" "}
          {petName}, because trust and reliability decide this more than any single feature.
        </p>

        <div className="pillseg" role="tablist" aria-label="Filter care providers" style={{ marginBottom: 18 }}>
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All
          </button>
          <button
            type="button"
            aria-pressed={filter === "circle"}
            onClick={() => setFilter("circle")}
          >
            In your circle
          </button>
          <button
            type="button"
            aria-pressed={filter === "verified"}
            onClick={() => setFilter("verified")}
          >
            Verified sitters
          </button>
        </div>

        {filter !== "verified" && circleCount === 0 && (
          <div className="card" style={{ borderStyle: "dashed", marginBottom: 18 }}>
            <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              No one in your circle yet.{" "}
              <Link href="/circle" style={{ color: "var(--coral-text)", fontWeight: 600 }}>
                Add someone you already trust
              </Link>
              .
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {shown.map((p) => (
            <ProviderRow key={p.id} provider={p} />
          ))}
        </div>
      </main>
      <TabBar />
    </>
  );
}

function ProviderRow({ provider }: { provider: CareProvider }) {
  return (
    <Link
      href={`/find-care/${provider.id}`}
      className="card"
      style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px" }}
    >
      <InitialAvatar name={provider.name} size={48} />
      <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 5 }}>
        <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.02rem" }}>
          {provider.name}
        </strong>
        <span style={{ color: "var(--ink-72)", fontSize: "0.78rem" }}>
          {provider.relation} · {provider.meta}
        </span>
        <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>
          {provider.reviewCount > 0
            ? `★ ${provider.rating.toFixed(1)} · ${provider.reviewCount} reviews`
            : "No reviews yet"}
        </span>
        {provider.blurb && (
          <span style={{ fontSize: "0.85rem", color: "var(--ink-72)" }}>{provider.blurb}</span>
        )}
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          {provider.verified ? (
            <Badge>✓ ID + background</Badge>
          ) : (
            <Badge dashed>In your circle</Badge>
          )}
          {provider.kind === "verified" && <Badge dashed attention>Example listing</Badge>}
        </span>
      </span>
      {provider.price && (
        <span className="mono" style={{ color: "var(--ink-72)", flex: "0 0 auto" }}>
          {provider.price}
        </span>
      )}
    </Link>
  );
}
