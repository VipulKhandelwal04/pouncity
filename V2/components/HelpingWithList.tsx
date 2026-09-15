import Link from "next/link";
import { PetAvatar } from "./PetAvatar";
import { isFedToday, type Diary } from "@/lib/diary-service";

/**
 * The "pets you help with" rows — one card per diary the current account
 * caregives on, opening its read-only caregiver view. Presentational: the
 * caller supplies the section header and decides whether to render it (there is
 * nothing to show when the list is empty). Shared by the Diary hub and the
 * Circle so the two surfaces can never drift while the Circle takes over
 * (tickets 01-04).
 */
export function HelpingWithList({ diaries }: { diaries: Diary[] }) {
  return (
    <div style={{ display: "grid", gap: 12, marginBottom: 26 }}>
      {diaries.map((d) => (
        <Link
          key={d.id}
          href={`/care/${d.id}`}
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}
        >
          <PetAvatar species={d.species} photoUrl={d.photoUrl} name={d.name} size={46} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
              {d.name}
            </strong>
            <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem", marginTop: 2 }}>
              {d.breed} · {isFedToday(d) ? "fed today" : "not fed yet"}
            </span>
          </span>
          {d.demo && <Chip>Demo</Chip>}
          <Chevron />
        </Link>
      ))}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        padding: "5px 10px",
        borderRadius: "var(--r-pill)",
        border: "var(--border-thin)",
        background: "var(--sun)",
        color: "var(--ink)",
        fontSize: "0.6rem",
      }}
    >
      {children}
    </span>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <path d="M9 6l6 6-6 6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
