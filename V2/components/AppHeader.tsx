"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { ProfileDrawer } from "./ProfileDrawer";
import { type Account } from "@/lib/diary-service";

export function AppHeader({ account }: { account: Account | null }) {
  // Local copy so a profile save in the drawer updates the chip immediately.
  const [acct, setAcct] = useState(account);
  const [open, setOpen] = useState(false);
  useEffect(() => setAcct(account), [account]);

  const initial = (acct?.name || acct?.email || "?").trim().charAt(0).toUpperCase();

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
      {acct ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open your profile"
            aria-haspopup="dialog"
            title={acct.email}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
            }}
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
              {acct.name && (
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
                  {acct.name}
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
          </button>
          <ProfileDrawer
            account={acct}
            open={open}
            onClose={() => setOpen(false)}
            onAccountChange={setAcct}
          />
        </>
      ) : null}
    </header>
  );
}
