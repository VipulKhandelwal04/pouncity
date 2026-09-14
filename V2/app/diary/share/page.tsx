"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import {
  getDiary,
  regenerateHandoverLink,
  revokeHandoverLink,
  handoverCode,
  diaryCaregivers,
  type Diary,
} from "@/lib/diary-service";

export default function SharePage() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [ready, setReady] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState<"link" | "code" | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const d = getDiary();
    if (!d) {
      router.replace("/diary/create");
      return;
    }
    setDiary(d);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    setReady(true);
  }, [router]);

  if (!ready || !diary) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  const token = diary.handover.token;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = token ? `${origin}/d/${token}` : "";
  const code = handoverCode(token);
  const caregivers = diaryCaregivers(diary.id);

  function generate() {
    const d = regenerateHandoverLink();
    if (d) setDiary(d);
  }
  function regenerate() {
    const d = regenerateHandoverLink();
    if (d) {
      setDiary(d);
      setCopiedWhat(null);
    }
  }
  function revoke() {
    const d = revokeHandoverLink();
    if (d) {
      setDiary(d);
      setConfirmingRevoke(false);
    }
  }
  async function copyText(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhat(which);
      setTimeout(() => setCopiedWhat(null), 1800);
    } catch {
      /* clipboard blocked — the value is still selectable in its field */
    }
  }
  async function share() {
    try {
      await navigator.share({ title: `${diary!.name}'s diary`, url: link });
    } catch {
      /* user cancelled or unsupported */
    }
  }

  if (!token) {
    return (
      <DetailShell title="Share with a sitter">
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            Make one link and hand it to a sitter. They sign in to help — a quick account
            so you know who&rsquo;s caring for {diary.name} — then see the routine and vet
            and log the daily feed. Set it up once, before you ever need it.
          </p>
          <button className="pill" onClick={generate} style={{ justifySelf: "start" }}>
            Create a handover link
          </button>
        </div>
      </DetailShell>
    );
  }

  return (
    <DetailShell title="Share with a sitter">
      <div style={{ display: "grid", gap: 22 }}>
        {/* the link */}
        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">{diary.name}&rsquo;s handover link</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "var(--border)",
              borderRadius: 14,
              background: "var(--cream)",
              padding: "10px 12px",
            }}
          >
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "transparent",
                font: "inherit",
                fontSize: "0.9rem",
                color: "var(--ink)",
              }}
              aria-label="Handover link"
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill pill--sm" onClick={() => copyText(link, "link")}>
              {copiedWhat === "link" ? "Copied" : "Copy link"}
            </button>
            {canShare && (
              <button className="pill pill--ghost pill--sm" onClick={share}>
                Share…
              </button>
            )}
          </div>
          {diary.handover.createdAt && (
            <span className="mono" style={{ color: "var(--ink-72)", fontSize: "0.58rem" }}>
              Live since {new Date(diary.handover.createdAt).toLocaleDateString()} · never
              expires
            </span>
          )}
        </div>

        {/* referral code — the same link, read out loud */}
        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Or read out a code</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              border: "var(--border)",
              borderRadius: 14,
              background: "var(--sun)",
              padding: "12px 14px",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: "1.15rem",
                letterSpacing: "0.12em",
                color: "var(--ink)",
                overflowWrap: "anywhere",
              }}
            >
              {code}
            </span>
            <button
              className="pill pill--ghost pill--sm"
              onClick={() => copyText(code, "code")}
              style={{ flex: "0 0 auto" }}
            >
              {copiedWhat === "code" ? "Copied" : "Copy code"}
            </button>
          </div>
          <span className="mono" style={{ color: "var(--ink-72)", fontSize: "0.58rem" }}>
            Same as the link — a sitter can enter this code instead. Changes only when you
            replace or revoke.
          </span>
        </div>

        {/* who has access — the named caregivers, read from memberships */}
        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Who has access</span>
          <div className="card">
            {caregivers.length === 0 ? (
              <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                No one yet. Anyone who joins with the link or code to help with {diary.name}{" "}
                shows up here.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
                {caregivers.map((c) => (
                  <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 34,
                        height: 34,
                        flex: "0 0 auto",
                        borderRadius: 999,
                        border: "var(--border)",
                        background: "var(--sun)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {(c.name || c.email).charAt(0).toUpperCase()}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                        {c.name || c.email}
                      </strong>
                      <span
                        className="mono"
                        style={{ display: "block", color: "var(--ink-72)", fontSize: "0.58rem" }}
                      >
                        Caregiver
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* manage */}
        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Manage</span>

          <button className="pill pill--ghost" onClick={regenerate} style={{ justifySelf: "start" }}>
            Replace with a new link
          </button>
          <span className="mono" style={{ color: "var(--ink-72)", fontSize: "0.58rem", marginTop: -4 }}>
            Makes a fresh link and turns the current one off.
          </span>

          {!confirmingRevoke ? (
            <button
              type="button"
              onClick={() => setConfirmingRevoke(true)}
              style={{
                justifySelf: "start",
                marginTop: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--coral-text)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              Revoke access
            </button>
          ) : (
            <div
              className="card"
              style={{ marginTop: 8, borderColor: "var(--coral-text)", display: "grid", gap: 14 }}
            >
              <div>
                <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  Revoke this link?
                </strong>
                <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", marginTop: 4 }}>
                  This ends access for <em>everyone</em> right away — the link stops working
                  for any sitter. You can share a new one afterward.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={revoke}
                  className="pill"
                  style={{ background: "var(--coral)" }}
                >
                  Yes, revoke
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRevoke(false)}
                  className="pill pill--ghost"
                >
                  Keep it live
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DetailShell>
  );
}
