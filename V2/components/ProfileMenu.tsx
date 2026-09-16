"use client";

import { useEffect } from "react";
import { signOut, type Account } from "@/lib/diary-service";

/**
 * The account dropdown, anchored under the header's profile chip: name +
 * email up top, then Profile (opens the details drawer) and Sign out. Pure
 * client state, so it opens instantly. Closes on outside click, Escape, or
 * choosing an item. The parent wrapper must be position: relative.
 */
export function ProfileMenu({
  account,
  open,
  onClose,
  onOpenProfile,
}: {
  account: Account;
  open: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/sign-in";
  }

  return (
    <>
      <style>{`
        .pmenu-item{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;
          padding:10px 12px;border:none;border-radius:12px;background:none;cursor:pointer;
          font:500 0.95rem var(--font-display);color:var(--ink);text-align:left}
        .pmenu-item:hover{background:var(--cream)}
      `}</style>
      {/* outside-click catcher */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 940, display: open ? "block" : "none" }}
      />
      <div
        role="menu"
        aria-hidden={!open}
        style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          zIndex: 950,
          minWidth: 264,
          background: "var(--panel)",
          border: "var(--border)",
          borderRadius: 18,
          padding: 10,
          display: "grid",
          gap: 2,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity .16s ease, transform .16s ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div style={{ padding: "8px 12px 12px" }}>
          {account.name && (
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "1.05rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {account.name}
            </div>
          )}
          <div
            className="mono"
            style={{
              fontSize: "0.68rem",
              color: "var(--ink-72)",
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {account.email}
          </div>
        </div>
        <div style={{ borderTop: "var(--border-thin)", margin: "0 2px 6px" }} />
        <button type="button" role="menuitem" className="pmenu-item" onClick={onOpenProfile}>
          <PersonIcon />
          Profile
        </button>
        <button
          type="button"
          role="menuitem"
          className="pmenu-item"
          onClick={handleSignOut}
          style={{ color: "var(--coral-text)" }}
        >
          <SignOutIcon />
          Sign out
        </button>
      </div>
    </>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 12h9m0 0-3.2-3.2M20 12l-3.2 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
