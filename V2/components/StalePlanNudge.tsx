"use client";

/**
 * The "details have changed" banner shown on the diet and grooming views when
 * the saved plan/guide predates an edit to the pet's core details. Pair with
 * planIsStale() from the seam; the caller decides whether to render it.
 */
export function StalePlanNudge({
  petName,
  thing,
  onRegenerate,
}: {
  petName: string;
  /** "plan" or "guide" — the noun in the banner copy. */
  thing: string;
  onRegenerate: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        borderStyle: "dashed",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ lineHeight: 1.5 }}>
        {petName}&rsquo;s details have changed since this {thing} was made.
      </span>
      <button className="pill pill--sm" onClick={onRegenerate}>
        Regenerate
      </button>
    </div>
  );
}
