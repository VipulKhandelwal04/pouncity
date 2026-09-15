"use client";

/**
 * Five tappable stars — the Owner's private Rating control. `value` 0 means
 * unrated (all outlined); tapping star n sets the rating to n. Purely a control:
 * persistence and the optional note live with the caller (HelperRow).
 */
export function StarRating({
  value,
  onSelect,
  labelName,
}: {
  value: number;
  onSelect: (stars: number) => void;
  labelName: string;
}) {
  return (
    <span
      role="group"
      aria-label={`Your private rating for ${labelName}`}
      style={{ display: "inline-flex", gap: 2 }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            aria-pressed={filled}
            style={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.6l2.7 5.9 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 2.9 1.3-6.2L3 9.2l6.3-.7z"
                fill={filled ? "var(--sun)" : "none"}
                stroke="var(--ink)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </span>
  );
}
