/**
 * The load-bearing honesty guardrail. It ships on every rendered plan/guide and
 * is never dismissible (no close control) — per the spec it must be present on
 * any AI-generated content, never a one-time modal.
 */
export function Disclaimer({ petName }: { petName: string }) {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        border: "var(--border-thin)",
        borderRadius: 14,
        background: "var(--panel)",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ flex: "0 0 auto", marginTop: 1 }}
      >
        <circle cx="12" cy="12" r="9.5" stroke="var(--ink)" strokeWidth="2" />
        <path d="M12 11v5" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="7.6" r="1.3" fill="var(--ink)" />
      </svg>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-72)", lineHeight: 1.5 }}>
        General guidance from public sources,{" "}
        <strong style={{ color: "var(--coral-text)" }}>not veterinary advice</strong>. For
        anything about {petName}&rsquo;s health, check with your vet.
      </p>
    </div>
  );
}
