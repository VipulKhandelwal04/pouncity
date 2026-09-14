import Link from "next/link";

/**
 * Focused full-screen detail chrome with a simple back to the hub. The Diary
 * cards open these; in U1 they carry a placeholder that names the ticket that
 * fills them in.
 */
export function DetailShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="app-shell" style={{ paddingTop: 18 }}>
      <Link
        href="/diary"
        className="mono"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Diary
      </Link>
      <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)", marginBottom: 18 }}>{title}</h1>
      {children}
    </main>
  );
}

export function TicketStub({ ticket, note }: { ticket: string; note: string }) {
  return (
    <div className="card" style={{ borderStyle: "dashed" }}>
      <span className="mono" style={{ color: "var(--coral-text)" }}>
        {ticket}
      </span>
      <p style={{ marginTop: 8, color: "var(--ink-72)" }}>{note}</p>
    </div>
  );
}
