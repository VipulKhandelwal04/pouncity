"use client";

import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { type Account } from "@/lib/diary-service";

export function AppHeader({ account }: { account: Account | null }) {
  const initial = (account?.name || account?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header
      style={{
        maxWidth: "var(--maxw)",
        margin: "0 auto",
        padding: "18px var(--gutter) 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Wordmark />
      {account ? (
        <Link
          href="/diary/profile"
          aria-label="Your profile"
          title={account.email}
          style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
        >
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              minWidth: 0,
              lineHeight: 1.2,
            }}
          >
            {account.name && (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  maxWidth: 150,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {account.name}
              </span>
            )}
            <span className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-72)" }}>
              Profile
            </span>
          </span>
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              flex: "0 0 auto",
              borderRadius: "50%",
              border: "var(--border-thin)",
              background: "var(--sun)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "1rem",
              color: "var(--ink)",
            }}
          >
            {initial}
          </span>
        </Link>
      ) : null}
    </header>
  );
}
