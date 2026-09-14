import type { Species } from "@/lib/diary-service";

/**
 * Flat-vector mascot avatar (the pet-photo placeholder). Honors the marketing
 * world: ink bodies, white googly eyes set nearly touching, coral nose. When
 * the owner adds a real photo (ticket 02) it takes over; until then this is the
 * warm empty state. overflow:visible so muzzle/ears can breathe past the box.
 */
export function PetAvatar({
  species,
  photoUrl,
  name,
  size = 96,
}: {
  species: Species;
  photoUrl?: string | null;
  name: string;
  size?: number;
}) {
  const box: React.CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    borderRadius: 20,
    border: "2.5px solid var(--ink)",
    background: species === "dog" ? "var(--sun)" : "var(--panel)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
  };

  if (photoUrl) {
    return (
      <div style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div style={box} role="img" aria-label={`${name}, a ${species}`}>
      <svg
        viewBox="0 0 120 120"
        width={size * 0.86}
        height={size * 0.86}
        style={{ overflow: "visible", display: "block" }}
        aria-hidden="true"
      >
        {species === "dog" ? <DogHead /> : <CatHead />}
      </svg>
    </div>
  );
}

function DogHead() {
  return (
    <g>
      {/* pointy ear (back) */}
      <path d="M28 44 Q20 14 40 26 Q42 40 34 50 Z" fill="var(--ink)" />
      {/* floppy folded ear (front) */}
      <path d="M92 40 Q104 20 100 46 Q96 62 82 56 Q80 46 92 40 Z" fill="var(--ink)" />
      {/* head + tapered muzzle as one fluid mass */}
      <path
        d="M60 22
           C82 22 94 38 94 58
           C94 78 82 92 70 96
           C68 104 52 104 50 96
           C38 92 26 78 26 58
           C26 38 38 22 60 22 Z"
        fill="var(--ink)"
      />
      {/* eyes — white, nearly touching */}
      <circle cx="50" cy="56" r="9" fill="#fff" />
      <circle cx="70" cy="56" r="9" fill="#fff" />
      <circle cx="52" cy="58" r="4.2" fill="var(--ink)" />
      <circle cx="68" cy="58" r="4.2" fill="var(--ink)" />
      {/* blunt coral nose */}
      <ellipse cx="60" cy="82" rx="8" ry="6.5" fill="var(--coral)" />
    </g>
  );
}

function CatHead() {
  return (
    <g>
      {/* triangle ears */}
      <path d="M30 40 L36 14 L54 34 Z" fill="var(--ink)" />
      <path d="M90 40 L84 14 L66 34 Z" fill="var(--ink)" />
      {/* round head */}
      <circle cx="60" cy="62" r="34" fill="var(--ink)" />
      {/* eyes nearly touching */}
      <circle cx="50" cy="58" r="8.5" fill="#fff" />
      <circle cx="70" cy="58" r="8.5" fill="#fff" />
      <circle cx="52" cy="60" r="4" fill="var(--ink)" />
      <circle cx="68" cy="60" r="4" fill="var(--ink)" />
      {/* coral nose + whiskers */}
      <path d="M55 74 L65 74 L60 80 Z" fill="var(--coral)" />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <line x1="40" y1="74" x2="24" y2="70" />
        <line x1="40" y1="78" x2="24" y2="80" />
        <line x1="80" y1="74" x2="96" y2="70" />
        <line x1="80" y1="78" x2="96" y2="80" />
      </g>
    </g>
  );
}
