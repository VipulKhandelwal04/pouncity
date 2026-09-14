import Link from "next/link";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/diary"
      className={`wordmark ${className ?? ""}`.trim()}
      aria-label="Pouncity — go to home"
    >
      pouncity
      <span className="dot" aria-hidden="true">
        <svg viewBox="0 0 34 30">
          <circle cx="14" cy="15" r="12" fill="#FF6B4A" />
          <path
            d="M3.5 11 Q14 18 25 9 M2.5 17 Q14 23 25.5 15 M6 23 Q15 27 22 21 M6.5 7 Q16 6 24 12"
            stroke="#D8492B"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M25 18 Q33 19 30 27 Q28 30 24 29"
            stroke="#FF6B4A"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </Link>
  );
}
