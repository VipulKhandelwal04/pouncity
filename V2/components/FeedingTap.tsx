"use client";

import { useEffect, useState } from "react";
import {
  confirmFeedingFor,
  undoFeedingFor,
  setTodayNoteFor,
  todayEntry,
  getFeedReminderFor,
  setFeedReminderFor,
  subscribeToPush,
  isFedToday,
  type Diary,
} from "@/lib/diary-service";
import { track } from "@/lib/analytics";

export function FeedingTap({
  diary,
  by,
  onChange,
}: {
  diary: Diary;
  by: string;
  onChange: (d: Diary) => void;
}) {
  const fed = isFedToday(diary);
  const entry = todayEntry(diary);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(entry?.note ?? "");
  const [remind, setRemind] = useState(false);
  const [justFed, setJustFed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFeedReminderFor(diary.id).then((v) => {
      if (!cancelled) setRemind(v);
    });
    return () => {
      cancelled = true;
    };
  }, [diary.id]);
  useEffect(() => setNoteText(entry?.note ?? ""), [entry?.note]);

  async function confirm() {
    const d = await confirmFeedingFor(diary.id, by);
    if (!d) return;
    // Analytics (ticket 11): the daily feeding tap. track() dedupes to once per
    // diary per day, so a repeat/undo-redo tap doesn't double-count.
    void track("daily_feeding_tap", { diaryId: diary.id });
    setJustFed(true);
    onChange(d);
  }
  async function undo() {
    const d = await undoFeedingFor(diary.id);
    if (!d) return;
    setNoteOpen(false);
    setJustFed(false);
    onChange(d);
  }
  async function saveNote() {
    const d = await setTodayNoteFor(diary.id, noteText);
    if (!d) return;
    setNoteOpen(false);
    onChange(d);
  }
  async function toggleRemind() {
    const v = !remind;
    setRemind(v);
    await setFeedReminderFor(diary.id, v);
    // Turning a reminder on is the push opt-in (best-effort). Declining the
    // permission never undoes the preference or gates anything.
    if (v) void subscribeToPush();
  }

  return (
    <section style={{ marginBottom: 26 }}>
      <div
        style={{
          background: "var(--sun)",
          border: "var(--border)",
          borderRadius: "var(--r-card)",
          padding: "clamp(20px, 5vw, 28px)",
        }}
      >
        <span className="mono" style={{ color: "var(--sun-ghost)" }}>
          Today
        </span>
        <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", margin: "6px 0 16px" }}>
          {fed ? `${diary.name} has eaten today` : `Has ${diary.name} eaten today?`}
        </h2>

        {!fed ? (
          <button
            type="button"
            onClick={confirm}
            className="pill"
            style={{ width: "100%", padding: "15px 26px", fontSize: "1.05rem" }}
          >
            Mark fed today
          </button>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--panel)",
                border: "var(--border)",
                borderRadius: 16,
                padding: "12px 14px",
              }}
            >
              <span className={justFed ? "pop" : undefined} style={{ display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                <Paw />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600 }}>
                Fed today
                <span style={{ color: "var(--ink-72)", fontWeight: 400, fontFamily: "var(--font-body)" }}>
                  {entry?.by ? `  ·  by ${entry.by}` : ""}
                </span>
              </span>
              <button type="button" onClick={undo} className="mono" style={{ color: "var(--coral-text)" }}>
                Undo
              </button>
            </div>

            {/* optional deviation note */}
            {noteOpen ? (
              <div style={{ marginTop: 12 }}>
                <input
                  className="input"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Extra treats today, half a bowl…"
                  autoFocus
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button type="button" className="pill pill--sm" onClick={saveNote}>
                    Save note
                  </button>
                  <button
                    type="button"
                    className="mono"
                    onClick={() => {
                      setNoteOpen(false);
                      setNoteText(entry?.note ?? "");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : entry?.note ? (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                style={{
                  display: "block",
                  marginTop: 12,
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <span style={{ fontStyle: "italic" }}>&ldquo;{entry.note}&rdquo;</span>{" "}
                <span className="mono" style={{ color: "var(--coral-text)" }}>
                  edit
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="mono"
                style={{ display: "block", marginTop: 12, color: "var(--coral-text)" }}
              >
                + Add a note
              </button>
            )}
          </>
        )}
      </div>

      {/* reminder opt-in (delivery is ticket 09) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 4px 0",
        }}
      >
        <span style={{ fontSize: "0.92rem" }}>Remind me if I forget</span>
        <button
          type="button"
          role="switch"
          aria-checked={remind}
          aria-label="Remind me if I forget to log a feeding"
          className="switch"
          onClick={toggleRemind}
        >
          <span className="knob" />
        </button>
      </div>
    </section>
  );
}

function Paw() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="var(--coral)" aria-hidden="true">
      <ellipse cx="16" cy="21" rx="7.5" ry="6" />
      <circle cx="8.5" cy="13" r="3.1" />
      <circle cx="14" cy="9.5" r="3.3" />
      <circle cx="20" cy="9.5" r="3.3" />
      <circle cx="24.5" cy="14" r="3.1" />
    </svg>
  );
}
