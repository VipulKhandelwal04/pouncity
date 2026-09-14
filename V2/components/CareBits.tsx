/**
 * Tiny shared bits for Find care + My circle: an initials avatar (same visual
 * language as the "who has access" list on the Share page) and a badge/chevron
 * pair. Kept out of app/diary/page.tsx's own local helpers since these are
 * used across three route files.
 */
export function InitialAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: 999,
        border: "var(--border)",
        background: "var(--sun)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.38,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function Badge({
  children,
  dashed,
  attention,
}: {
  children: React.ReactNode;
  dashed?: boolean;
  attention?: boolean;
}) {
  return (
    <span
      className="mono"
      style={{
        padding: "3px 10px",
        borderRadius: "var(--r-pill)",
        border: dashed ? "1.5px dashed var(--ink-72)" : "var(--border-thin)",
        color: attention ? "var(--coral-text)" : dashed ? "var(--ink-72)" : "var(--ink)",
        fontSize: "0.6rem",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** A filled status pill — Records chips (Neutered, Registered, Rabies) and the
 *  "Demo" marker on caregiving pets. Distinct from Badge (outline style, used
 *  for Find care's verification/circle markers). */
export function Chip({
  children,
  tone = "ok",
}: {
  children: React.ReactNode;
  tone?: "ok" | "warn";
}) {
  const warn = tone === "warn";
  return (
    <span
      className="mono"
      style={{
        padding: "5px 10px",
        borderRadius: "var(--r-pill)",
        border: "var(--border-thin)",
        background: warn ? "var(--coral)" : "var(--sun)",
        color: "var(--ink)",
        fontSize: "0.6rem",
      }}
    >
      {children}
    </span>
  );
}

export function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <path d="M9 6l6 6-6 6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
