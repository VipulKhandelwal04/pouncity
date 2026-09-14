"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { Chevron, InitialAvatar } from "@/components/CareBits";
import { PetAvatar } from "@/components/PetAvatar";
import {
  careRequests,
  getAccount,
  getCircle,
  getDiary,
  type Account,
  type Diary,
} from "@/lib/diary-service";

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [circleCount, setCircleCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const acct = getAccount();
    if (!acct) {
      router.replace("/sign-in");
      return;
    }
    setAccount(acct);
    setDiary(getDiary());
    setCircleCount(getCircle().length);
    setRequestCount(careRequests().length);
    setReady(true);
  }, [router]);

  if (!ready || !account) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  return (
    <DetailShell title="My profile">
      <div style={{ display: "grid", gap: 20 }}>
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <InitialAvatar name={account.name || account.email} size={56} />
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem" }}>
              {account.name || "No name set"}
            </strong>
            <div className="mono" style={{ color: "var(--ink-72)", marginTop: 3 }}>
              {account.email}
            </div>
            {account.createdAt && (
              <div style={{ color: "var(--ink-72)", fontSize: "0.8rem", marginTop: 4 }}>
                Member since{" "}
                {new Date(account.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", display: "block" }}>
              {circleCount}
            </span>
            <span className="mono">Your circle</span>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", display: "block" }}>
              {requestCount}
            </span>
            <span className="mono">Requests sent</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Pets</span>
          {diary ? (
            <Link
              href="/diary"
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}
            >
              <PetAvatar species={diary.species} photoUrl={diary.photoUrl} name={diary.name} size={46} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{diary.name}</strong>
                <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem" }}>
                  {diary.breed}
                </span>
              </span>
              <Chevron />
            </Link>
          ) : (
            <div className="card" style={{ borderStyle: "dashed" }}>
              <p style={{ color: "var(--ink-72)", fontSize: "0.9rem" }}>
                No pet of your own yet.{" "}
                <Link href="/diary/create" style={{ color: "var(--coral-text)", fontWeight: 600 }}>
                  Create a diary
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        <Link
          href="/profile/sitter"
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
              Care for other people&rsquo;s pets too
            </strong>
            <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem", marginTop: 2 }}>
              Set up a sitter profile
            </span>
          </span>
          <Chevron />
        </Link>
      </div>
    </DetailShell>
  );
}
