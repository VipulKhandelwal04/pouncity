"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { Badge, InitialAvatar } from "@/components/CareBits";
import {
  getDiary,
  getCareProvider,
  careReviews,
  hasRequestedCare,
  requestCare,
  type CareProvider,
  type CareReview,
} from "@/lib/diary-service";

export default function ProviderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<CareProvider | null>(null);
  const [reviews, setReviews] = useState<CareReview[]>([]);
  const [petName, setPetName] = useState("your pet");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getCareProvider(params.id);
    if (!p) {
      router.replace("/find-care");
      return;
    }
    setProvider(p);
    setReviews(careReviews(p.id));
    setSent(hasRequestedCare(p.id));
    const d = getDiary();
    if (d) setPetName(d.name);
    setReady(true);
  }, [params.id, router]);

  if (!ready || !provider) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  function send() {
    if (!provider) return;
    const req = requestCare(provider, when, notes);
    if (req) setSent(true);
  }

  const firstName = provider.name.split(" ")[0];

  return (
    <DetailShell title={provider.name} backHref="/find-care" backLabel="Find care">
      <div style={{ display: "grid", gap: 20 }}>
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <InitialAvatar name={provider.name} size={58} />
          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <span style={{ color: "var(--ink-72)", fontSize: "0.85rem" }}>
              {provider.relation} · {provider.meta}
            </span>
            <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {provider.verified ? (
                <>
                  <Badge>✓ ID verified</Badge>
                  <Badge>✓ Background checked</Badge>
                </>
              ) : (
                <Badge dashed>In your circle</Badge>
              )}
            </span>
          </div>
        </div>

        {provider.kind === "verified" && (
          <div className="card" style={{ borderStyle: "dashed" }}>
            <p style={{ color: "var(--ink-72)", fontSize: "0.85rem", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--coral-text)" }}>Example listing.</strong> Sitter
              onboarding isn&rsquo;t live yet — this profile shows what a verified sitter will
              look like once it is.
            </p>
          </div>
        )}

        {provider.blurb && <p style={{ lineHeight: 1.55 }}>{provider.blurb}</p>}

        <div style={{ display: "grid", gap: 10 }}>
          <span className="mono">Reviews</span>
          <div className="card">
            {reviews.length === 0 ? (
              <p style={{ color: "var(--ink-72)", fontSize: "0.9rem" }}>
                No reviews yet{provider.kind === "circle" ? "." : " — be the first after a trip."}
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {reviews.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: i ? 14 : 0,
                      borderTop: i ? "var(--border-thin)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: "0.85rem",
                        marginBottom: 4,
                      }}
                    >
                      <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                        {r.who}
                      </strong>
                      <span className="mono" style={{ color: "var(--ink-72)" }}>
                        {r.when}
                      </span>
                    </div>
                    <div style={{ color: "var(--coral-text)", marginBottom: 4 }}>
                      {"★".repeat(Math.round(r.stars))}
                      {"☆".repeat(5 - Math.round(r.stars))}
                    </div>
                    <p style={{ fontSize: "0.88rem" }}>{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: 14 }}>
          <span className="mono">Request care</span>
          {sent ? (
            <p style={{ color: "var(--coral-text)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
              ✓ Request sent — {firstName} will need to reach you directly for now.
            </p>
          ) : (
            <>
              <div className="form-field" style={{ margin: 0 }}>
                <label htmlFor="when">When do you need care?</label>
                <input
                  id="when"
                  className="input"
                  placeholder="e.g. Sep 20–24"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label htmlFor="notes">Anything {firstName} should know about {petName}?</label>
                <textarea
                  id="notes"
                  className="input"
                  placeholder="Routine, quirks, vet contact…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button type="button" className="pill" onClick={send} style={{ justifySelf: "start" }}>
                Send request
              </button>
            </>
          )}
        </div>
      </div>
    </DetailShell>
  );
}
