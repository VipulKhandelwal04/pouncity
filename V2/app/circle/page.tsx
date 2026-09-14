"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { Chevron, InitialAvatar } from "@/components/CareBits";
import {
  addCircleContact,
  getAccount,
  getCircle,
  getDiary,
  type Account,
  type CareProvider,
} from "@/lib/diary-service";

const RELATIONS = ["Family", "Friend", "Neighbour", "Colleague"];

export default function CirclePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [circle, setCircle] = useState<CareProvider[]>([]);
  const [petName, setPetName] = useState("your pet");
  const [name, setName] = useState("");
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const acct = getAccount();
    if (!acct) {
      router.replace("/sign-in");
      return;
    }
    setAccount(acct);
    setCircle(getCircle());
    const d = getDiary();
    if (d) setPetName(d.name);
    setReady(true);
  }, [router]);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const contact = addCircleContact({ name: trimmed, relation, phone: phone.trim() || undefined });
    if (!contact) return;
    setCircle(getCircle());
    setName("");
    setPhone("");
  }

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
          My circle
        </h1>
        <p style={{ color: "var(--ink-72)", lineHeight: 1.55, marginBottom: 20 }}>
          The people you already trust with {petName} — family, friends, neighbours. Add them
          here so they&rsquo;re one tap away in Find care.
        </p>

        <div className="card" style={{ display: "grid", gap: 4, marginBottom: 20 }}>
          <span className="mono" style={{ marginBottom: 10 }}>
            Add someone
          </span>
          <div className="form-field" style={{ margin: 0, marginBottom: 14 }}>
            <label htmlFor="circle-name">Name</label>
            <input
              id="circle-name"
              className="input"
              placeholder="e.g. Priya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ margin: 0, marginBottom: 14 }}>
            <label htmlFor="circle-relation">Relation</label>
            <select
              id="circle-relation"
              className="input"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
            >
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ margin: 0, marginBottom: 16 }}>
            <label htmlFor="circle-phone">Phone (optional)</label>
            <input
              id="circle-phone"
              className="input"
              placeholder="+91 9xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="pill pill--sm"
            onClick={add}
            disabled={!name.trim()}
            style={{ justifySelf: "start" }}
          >
            + Add to circle
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Your circle</span>
          {circle.length === 0 ? (
            <div className="card" style={{ borderStyle: "dashed" }}>
              <p style={{ color: "var(--ink-72)", fontSize: "0.9rem" }}>
                No one yet — add the first person above.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {circle.map((c) => (
                <Link
                  key={c.id}
                  href={`/find-care/${c.id}`}
                  className="card"
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}
                >
                  <InitialAvatar name={c.name} size={44} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      {c.name}
                    </strong>
                    <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem" }}>
                      {c.relation}
                      {c.meta && c.meta !== "In your circle" ? ` · ${c.meta}` : ""}
                    </span>
                  </span>
                  <Chevron />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <TabBar />
    </>
  );
}
