"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";
import { ProfileMenu } from "./ProfileMenu";
import { ProfileDrawer } from "./ProfileDrawer";
import { type Account } from "@/lib/diary-service";

export function AppHeader({ account }: { account: Account | null }) {
  // Local copy so a profile save in the drawer updates the chip immediately.
  const [acct, setAcct] = useState(account);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        <span style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            title={acct.email}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              minHeight: 46,
              padding: "4px 5px 4px 14px",
              background: "var(--panel)",
              border: "var(--border)",
              borderRadius: 999,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
            }}
          >
            {acct.name && (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {acct.name}
              </span>
            )}
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                flex: "0 0 auto",
                borderRadius: "50%",
                border: "var(--border-thin)",
                background: "var(--sun)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--ink)",
              }}
            >
              {initial}
            </span>
          </button>
          <ProfileMenu
            account={acct}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onOpenProfile={() => {
              setMenuOpen(false);
              setDrawerOpen(true);
            }}
          />
        </span>
      ) : null}
      {acct && (
        <ProfileDrawer
          account={acct}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onAccountChange={setAcct}
        />
      )}
    </header>
  );
}
