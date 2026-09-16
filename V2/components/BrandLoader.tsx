"use client";

/**
 * The branded loading screen: the yarn ball rolling gently over the wordmark,
 * continuing the installed app's splash instead of a bare "Loading…" line.
 * Motion respects prefers-reduced-motion.
 */
export function BrandLoader() {
  return (
    <main
      className="app-shell"
      role="status"
      aria-label="Loading Pouncity"
      style={{ minHeight: "72vh", display: "grid", placeItems: "center" }}
    >
      <style>{`
        @keyframes brand-loader-roll { to { transform: rotate(360deg); } }
        .brand-loader-ball { animation: brand-loader-roll 1.7s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .brand-loader-ball { animation: none; } }
      `}</style>
      <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
        <svg
          className="brand-loader-ball"
          width="64"
          height="64"
          viewBox="0 0 32 32"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <circle cx="16" cy="16" r="13" fill="#FF6B4A" />
          <path
            d="M4 12 Q16 20 28 10 M3 18 Q16 25 28 17 M6 25 Q17 29 25 22 M7 7 Q18 6 27 13"
            stroke="#D8492B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1.35rem",
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          pouncity
        </span>
      </div>
    </main>
  );
}
