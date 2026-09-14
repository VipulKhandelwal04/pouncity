"use client";

import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { signOut, type Account } from "@/lib/diary-service";

/** The sign-in page is served at /sign-in on the same origin. */
function signInUrl(): string {
  return "/sign-in";
}

export function AppHeader({ account }: { account: Account | null }) {
  function handleSignOut() {
    signOut();
    window.location.href = signInUrl();
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Link
            href="/profile"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              minWidth: 0,
              lineHeight: 1.2,
            }}
            title={`${account.email} — view profile`}
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
            <span
              className="mono"
              style={{
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.6rem",
                color: "var(--ink-72)",
              }}
            >
              {account.email}
            </span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="pill pill--ghost pill--sm"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </header>
  );
}
