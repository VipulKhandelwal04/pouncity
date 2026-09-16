"use client";

/**
 * The yarn ball rolling in place — the in-flow loading mark for working
 * states (BrandLoader is its full-screen sibling). Reduced-motion swaps the
 * roll for a gentle opacity pulse so the "busy" signal survives.
 */
export function YarnSpinner({ size = 44 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes yarn-roll { to { transform: rotate(360deg); } }
        .yarn-spinner { animation: yarn-roll 1.7s linear infinite; display: block; margin: 0 auto; }
        @media (prefers-reduced-motion: reduce) {
          @keyframes yarn-pulse { 50% { opacity: .45; } }
          .yarn-spinner { animation: yarn-pulse 1.6s ease-in-out infinite; }
        }
      `}</style>
      <svg
        className="yarn-spinner"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="13" fill="var(--coral)" />
        <path
          d="M4 12 Q16 20 28 10 M3 18 Q16 25 28 17 M6 25 Q17 29 25 22 M7 7 Q18 6 27 13"
          stroke="var(--coral-deep)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}
