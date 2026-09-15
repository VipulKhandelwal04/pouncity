"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import type { Account, Rating } from "@/lib/diary-service";

/**
 * One helper on the Owner's Circle — a current Caregiver or a Past Caregiver —
 * with the Owner's private Rating (stars + optional note). Replaces the plain
 * CaregiverList / PastCaregiverList rows now that both need the same rating
 * control. The Rating is the Owner's alone (ADR-0005); the caregiver never sees
 * it. `variant` only changes the muted styling of a past helper.
 */
export function HelperRow({
  account,
  sublabel,
  variant,
  rating,
  onRate,
}: {
  account: Account;
  sublabel: string;
  variant: "current" | "past";
  rating: Rating | null;
  onRate: (stars: number, note: string) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const stars = rating?.stars ?? 0;
  const name = account.name || account.email;
  const past = variant === "past";

  function pickStar(n: number) {
    onRate(n, rating?.note ?? ""); // set/overwrite stars, keep any existing note
  }
  function openNote() {
    setDraft(rating?.note ?? "");
    setNoteOpen(true);
  }
  function saveNote() {
    onRate(stars || 1, draft); // note is only offered once rated, so stars ≥ 1
    setNoteOpen(false);
  }

  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          flex: "0 0 auto",
          borderRadius: 999,
          border: past ? "var(--border-thin)" : "var(--border)",
          background: past ? "var(--panel)" : "var(--sun)",
          color: past ? "var(--ink-72)" : "var(--ink)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "0.9rem",
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>

      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 8 }}>
        <div>
          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{name}</strong>
          <span className="hint" style={{ display: "block" }}>
            {sublabel}
          </span>
        </div>

        <StarRating value={stars} onSelect={pickStar} labelName={name} />

        {stars > 0 && (
          <div style={{ display: "grid", gap: 6 }}>
            {rating?.note && !noteOpen && (
              <p
                style={{
                  color: "var(--ink-72)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {rating.note}
              </p>
            )}
            {!noteOpen ? (
              <button
                type="button"
                onClick={openNote}
                className="mono tap-target"
                style={{
                  justifySelf: "start",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--coral-text)",
                }}
              >
                {rating?.note ? "Edit note" : "Add a note"}
              </button>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <textarea
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Private to you. How did it go?"
                  rows={2}
                  style={{ minHeight: 60 }}
                  aria-label={`Private note for ${name}`}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="pill pill--sm" onClick={saveNote}>
                    Save note
                  </button>
                  <button
                    type="button"
                    className="pill pill--ghost pill--sm"
                    onClick={() => setNoteOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
