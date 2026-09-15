"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { getDiary, feedingHistory, type Diary } from "@/lib/diary-service";

/**
 * The pet's Personal Feeding Diary — a daily calendar of every logged feed.
 * Reads the same feeding log the hub tap writes (diary-service); the backend
 * later swaps the source behind that seam, this view is untouched.
 */
export default function FeedingDiaryPage() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  useEffect(() => {
    async function run() {
      const d = await getDiary();
      if (!d) {
        router.replace("/diary/create");
        return;
      }
      setDiary(d);
      setReady(true);
    }
    run();
  }, [router]);

  if (!ready || !diary) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  const entries = feedingHistory(diary); // newest first
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const { y, m } = cursor;
  const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = new Date(y, m, 1).getDay(); // 0 = Sunday
  const todayIso = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const atCurrentMonth = y === now.getFullYear() && m === now.getMonth();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isoFor = (day: number) => `${monthPrefix}-${String(day).padStart(2, "0")}`;
  const monthLabel = new Date(y, m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));

  function step(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }
  function toToday() {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <DetailShell title={`${diary.name}'s Feeding Diary`}>
      <div style={{ display: "grid", gap: 22 }}>
        {/* month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button type="button" className="pill pill--ghost pill--sm" aria-label="Previous month" onClick={() => step(-1)}>
            ‹
          </button>
          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem" }}>
            {monthLabel}
          </strong>
          <button
            type="button"
            className="pill pill--ghost pill--sm"
            aria-label="Next month"
            onClick={() => step(1)}
            disabled={atCurrentMonth}
            style={atCurrentMonth ? { opacity: 0.4, pointerEvents: "none" } : undefined}
          >
            ›
          </button>
        </div>

        {/* calendar */}
        <div className="card" style={{ padding: "16px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
              <span
                key={w}
                className="mono"
                style={{ textAlign: "center", color: "var(--ink-72)", fontSize: "0.56rem", paddingBottom: 4 }}
              >
                {w}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />;
              const iso = isoFor(day);
              const fed = byDate.has(iso);
              const entry = byDate.get(iso);
              const isToday = iso === todayIso;
              const isFuture = iso > todayIso;
              return (
                <span
                  key={iso}
                  style={{ aspectRatio: "1", display: "grid", placeItems: "center", position: "relative" }}
                >
                  <span
                    title={fed ? `Fed by ${entry?.by}${entry?.note ? ` · ${entry.note}` : ""}` : undefined}
                    style={{
                      width: "82%",
                      aspectRatio: "1",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 999,
                      background: fed ? "var(--coral)" : "transparent",
                      border: isToday ? "2.5px solid var(--ink)" : "2px solid transparent",
                      color: "var(--ink)",
                      opacity: isFuture ? 0.35 : 1,
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                    }}
                  >
                    {day}
                  </span>
                  {entry?.note && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        bottom: 3,
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: "var(--ink)",
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>

          {/* legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "var(--border-thin)",
              flexWrap: "wrap",
            }}
          >
            <Legend swatch={<Dot filled />}>Fed</Legend>
            <Legend swatch={<Dot />}>Not logged</Legend>
            <Legend swatch={<span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ink)" }} />}>
              Has a note
            </Legend>
          </div>
        </div>

        {/* month summary + entries */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span className="mono">
              {monthEntries.length} fed {monthEntries.length === 1 ? "day" : "days"} in {monthLabel.split(" ")[0]}
            </span>
            {!atCurrentMonth && (
              <button type="button" className="mono" onClick={toToday} style={{ color: "var(--coral-text)" }}>
                Jump to today
              </button>
            )}
          </div>

          {monthEntries.length === 0 ? (
            <div className="card" style={{ borderStyle: "dashed", textAlign: "center", padding: "20px 16px" }}>
              <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", margin: 0 }}>
                No feeds logged this month.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {monthEntries.map((e) => (
                <li
                  key={e.date}
                  className="card"
                  style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <span aria-hidden="true" style={{ display: "grid", placeItems: "center", flex: "0 0 auto", marginTop: 1 }}>
                    <Paw />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{dayLabel(e.date)}</strong>
                    <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>{`  ·  fed by ${e.by}`}</span>
                    {e.note && (
                      <span style={{ display: "block", fontStyle: "italic", fontSize: "0.88rem", marginTop: 3 }}>
                        &ldquo;{e.note}&rdquo;
                      </span>
                    )}
                  </span>
                  <span className="mono" style={{ fontSize: "0.6rem", flex: "0 0 auto", color: "var(--ink-72)" }}>
                    {e.date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DetailShell>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Legend({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      {swatch}
      <span className="mono" style={{ fontSize: "0.56rem", color: "var(--ink-72)" }}>
        {children}
      </span>
    </span>
  );
}

function Dot({ filled }: { filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14,
        height: 14,
        borderRadius: 999,
        background: filled ? "var(--coral)" : "transparent",
        border: "2px solid var(--ink)",
        flex: "0 0 auto",
      }}
    />
  );
}

function Paw() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="var(--coral)" aria-hidden="true">
      <ellipse cx="16" cy="21" rx="7.5" ry="6" />
      <circle cx="8.5" cy="13" r="3.1" />
      <circle cx="14" cy="9.5" r="3.3" />
      <circle cx="20" cy="9.5" r="3.3" />
      <circle cx="24.5" cy="14" r="3.1" />
    </svg>
  );
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
