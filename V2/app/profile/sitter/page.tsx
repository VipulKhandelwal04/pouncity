"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { Badge, InitialAvatar } from "@/components/CareBits";
import {
  getAccount,
  getSitterListing,
  saveSitterListing,
  type Account,
} from "@/lib/diary-service";

const PET_TYPES = ["Dogs", "Cats"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SitterProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [bio, setBio] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [petTypes, setPetTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<("open" | "booked")[]>(
    Array(7).fill("open") as ("open" | "booked")[]
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const acct = getAccount();
    if (!acct) {
      router.replace("/sign-in");
      return;
    }
    setAccount(acct);
    const listing = getSitterListing();
    if (listing) {
      setBio(listing.bio);
      setPriceLabel(listing.priceLabel);
      setPetTypes(listing.petTypes);
      setAvailability(listing.availability);
      setSavedAt(listing.updatedAt);
    }
    setReady(true);
  }, [router]);

  if (!ready || !account) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  function togglePetType(t: string) {
    setPetTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function toggleDay(i: number) {
    setAvailability((cur) => {
      const next = [...cur];
      next[i] = next[i] === "open" ? "booked" : "open";
      return next;
    });
  }

  function save() {
    const listing = saveSitterListing({ bio, priceLabel, petTypes, availability });
    if (listing) setSavedAt(listing.updatedAt);
  }

  const displayName = account.name || account.email;

  return (
    <DetailShell title="Sitter profile" backHref="/profile" backLabel="My profile">
      <div style={{ display: "grid", gap: 20 }}>
        <div className="card" style={{ borderStyle: "dashed" }}>
          <p style={{ color: "var(--ink-72)", fontSize: "0.85rem", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--coral-text)" }}>Not live yet.</strong> Real ID and
            background-check verification for sitters isn&rsquo;t built. Saving a draft here
            keeps it ready — it won&rsquo;t appear in anyone&rsquo;s Find care until that exists.
          </p>
        </div>

        <div className="card" style={{ display: "grid", gap: 14 }}>
          <span className="mono">Your listing (draft)</span>

          <div className="form-field" style={{ margin: 0 }}>
            <label htmlFor="sitter-bio">Bio</label>
            <textarea
              id="sitter-bio"
              className="input"
              placeholder="Tell owners about your experience with pets, your home, your routine…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label htmlFor="sitter-price">Price</label>
            <input
              id="sitter-price"
              className="input"
              placeholder="e.g. ₹550/night"
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label>I can care for</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PET_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => togglePetType(t)}
                  className="pill pill--sm"
                  style={{
                    background: petTypes.includes(t) ? "var(--sun)" : "var(--panel)",
                    color: "var(--ink)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label>Available this week — tap to toggle</label>
            <div style={{ display: "flex", gap: 6 }}>
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 2px",
                    borderRadius: 12,
                    border: "var(--border-thin)",
                    background: availability[i] === "open" ? "var(--sun)" : "var(--panel)",
                    color: "var(--ink)",
                  }}
                >
                  <span className="mono" style={{ fontSize: "0.58rem" }}>
                    {d}
                  </span>
                  <span style={{ fontSize: "0.75rem" }}>{availability[i] === "open" ? "✓" : "–"}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="pill pill--sm" onClick={save}>
              Save draft
            </button>
            {savedAt && (
              <span className="mono" style={{ color: "var(--ink-72)" }}>
                Saved {new Date(savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">How owners will see you — once this is live</span>
          <div className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px" }}>
            <InitialAvatar name={displayName} size={48} />
            <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 5 }}>
              <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{displayName}</strong>
              <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>
                {petTypes.length > 0 ? petTypes.join(" & ") + " sitter" : "Pet sitter"}
              </span>
              <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>
                {bio || "Your bio will show up here."}
              </span>
              <Badge dashed attention>
                Draft — not published
              </Badge>
            </span>
            {priceLabel && (
              <span className="mono" style={{ color: "var(--ink-72)", flex: "0 0 auto" }}>
                {priceLabel}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="pill"
          disabled
          title="Sitter onboarding isn't live yet"
          style={{ justifySelf: "start" }}
        >
          Publish listing
        </button>
      </div>
    </DetailShell>
  );
}
