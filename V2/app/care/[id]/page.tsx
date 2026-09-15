"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PetAvatar } from "@/components/PetAvatar";
import { FeedingTap } from "@/components/FeedingTap";
import {
  getAccount,
  getDiaryById,
  roleOnDiary,
  feedingHistory,
  type Account,
  type Diary,
} from "@/lib/diary-service";

/**
 * The Caregiver's read-mostly view of a pet they help with. Everything is
 * read-only except the daily feeding confirm. Owner-only records (desexing /
 * registration / rabies) and all edit / share / regenerate controls are simply
 * not rendered here — there is nothing in the DOM to hide.
 *
 * Access is gated two ways: the visitor must hold a caregiver Membership on this
 * diary, AND the diary's handover link must still be live. Revoking the link
 * (token → null) ends access immediately, before slice 04 even cleans up the
 * membership row.
 *
 * Like the handover gate, this is account-sensitive: getAccount() is called
 * ALONE (no signIn fallback), so a signed-out visitor is sent to the sign-in
 * gate rather than silently minting an account.
 */
type Status = "loading" | "view" | "ended";

export default function CaregiverView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [status, setStatus] = useState<Status>("loading");
  const [diary, setDiary] = useState<Diary | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    async function run() {
      const acct = await getAccount(); // no signIn fallback — signed-out stays signed-out
      const d = await getDiaryById(id);
      const role = acct ? await roleOnDiary(id) : null;

      if (role === "owner") {
        router.replace("/diary"); // the owner has their own full view
        return;
      }
      if (!d || !d.handover.token) {
        setStatus("ended"); // unknown pet, or the link was turned off → no access
        return;
      }
      if (!acct || role !== "caregiver") {
        router.replace(`/d/${d.handover.token}`); // must sign in / join first → the gate
        return;
      }
      setAccount(acct);
      setDiary(d);
      setStatus("view");
    }
    run();
  }, [id, router]);

  if (status === "loading") {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  if (status === "ended" || !diary) {
    return (
      <>
        <AppHeader account={account} />
        <main className="app-shell" style={{ paddingTop: 20 }}>
          <div
            className="card"
            style={{ borderStyle: "dashed", textAlign: "center", padding: "34px 22px" }}
          >
            <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Access ended</h1>
            <p style={{ color: "var(--ink-72)" }}>
              This pet isn&rsquo;t shared with you right now. The owner may have turned the
              link off. If you&rsquo;re still helping out, ask them for a fresh one.
            </p>
          </div>
        </main>
      </>
    );
  }

  const history = feedingHistory(diary).slice(0, 6);
  const meta = [diary.breed, diary.ageLabel, diary.weightKg ? `${diary.weightKg} kg` : null]
    .filter(Boolean)
    .join("  ·  ");
  const plan = diary.dietPlan;
  const groom = diary.groomingGuide;

  return (
    <>
      <AppHeader account={account} />
      <main className="app-shell" style={{ paddingTop: 4 }}>
        {/* helper context — read-only, unmistakably not the owner's view */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--sun)",
            border: "var(--border)",
            borderRadius: "var(--r-pill)",
            padding: "8px 14px",
            margin: "8px 0 20px",
          }}
        >
          <EyeIcon />
          <span className="mono" style={{ color: "var(--ink)" }}>
            You&rsquo;re helping with {diary.name} · read-only
          </span>
        </div>

        {/* pet header */}
        <section style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <PetAvatar species={diary.species} photoUrl={diary.photoUrl} name={diary.name} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "clamp(1.9rem, 8vw, 2.4rem)" }}>{diary.name}</h1>
            <p style={{ color: "var(--ink-72)", marginTop: 4, fontSize: "0.95rem" }}>{meta}</p>
          </div>
        </section>

        {/* the one editable thing — log today's feed, attributed to the caregiver */}
        <FeedingTap
          diary={diary}
          by={account?.name || "you"}
          onChange={(d) => setDiary(d)}
        />

        {/* recent feeding — read-only, last few days (not the owner's full calendar) */}
        <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
          Recent feeding
        </h2>
        <div className="card" style={{ marginBottom: 26 }}>
          {history.length === 0 ? (
            <p style={{ color: "var(--ink-72)", fontSize: "0.9rem" }}>
              No feeds logged yet. Yours will show here.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {history.map((e) => (
                <li key={e.date} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span aria-hidden="true" style={{ flex: "0 0 auto" }}>
                    <MiniPaw />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      {dayLabel(e.date)}
                    </strong>
                    <span style={{ color: "var(--ink-72)", fontSize: "0.9rem" }}>
                      {" · fed by "}
                      {e.by}
                    </span>
                    {e.note && (
                      <span
                        style={{
                          display: "block",
                          color: "var(--ink-72)",
                          fontSize: "0.88rem",
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{e.note}&rdquo;
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* diet plan — read-only */}
        {plan && (
          <>
            <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
              Diet plan
            </h2>
            <div className="card" style={{ marginBottom: 26, display: "grid", gap: 14 }}>
              <p style={{ lineHeight: 1.55 }}>{plan.summary}</p>
              <div style={{ borderTop: "var(--border-thin)", paddingTop: 14, display: "grid", gap: 8 }}>
                <Row label="Each day" value={plan.portionPerDay} />
                <Row label="Meals" value={plan.meals} />
                <Row label="Food" value={plan.currentFood} />
              </div>
              {plan.tips.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  {plan.tips.map((t, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: "0.92rem" }}>
                      <span aria-hidden="true" style={{ flex: "0 0 auto" }}>
                        <MiniPaw />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* grooming guide — read-only */}
        {groom && (
          <>
            <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
              Grooming guide
            </h2>
            <div className="card" style={{ marginBottom: 26, display: "grid", gap: 14 }}>
              <p style={{ lineHeight: 1.55 }}>{groom.summary}</p>
              <div style={{ borderTop: "var(--border-thin)", paddingTop: 14, display: "grid", gap: 8 }}>
                <Row label="Coat" value={groom.coatType} />
                <Row label="Groomer" value={`Every ${groom.frequencyWeeks} weeks`} />
              </div>
              {groom.routine.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  {groom.routine.map((t, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: "0.92rem" }}>
                      <span aria-hidden="true" style={{ flex: "0 0 auto" }}>
                        <MiniPaw />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
              {groom.professional && (
                <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {groom.professional}
                </p>
              )}
            </div>
          </>
        )}

        {/* quirks — read-only */}
        {diary.quirks && (
          <>
            <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
              Good to know
            </h2>
            <div className="card" style={{ marginBottom: 26 }}>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{diary.quirks}</p>
            </div>
          </>
        )}

        {/* vet — read-only, reachable fast */}
        {diary.vet && (
          <>
            <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
              Vet
            </h2>
            <div className="card" style={{ marginBottom: 26 }}>
              <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                {diary.vet.name || diary.vet.clinic || "Vet contact"}
              </strong>
              <div style={{ color: "var(--ink-72)", fontSize: "0.9rem", marginTop: 2 }}>
                {diary.vet.name && diary.vet.clinic && <div>{diary.vet.clinic}</div>}
                {diary.vet.phone && (
                  <a
                    href={`tel:${diary.vet.phone.replace(/[^\d+]/g, "")}`}
                    style={{ color: "var(--coral-text)" }}
                  >
                    {diary.vet.phone}
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

/* ---- pieces ------------------------------------------------------------- */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <span className="mono" style={{ flex: "0 0 auto" }}>
        {label}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function MiniPaw() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="var(--coral)" aria-hidden="true">
      <ellipse cx="16" cy="21" rx="7.5" ry="6" />
      <circle cx="8.5" cy="13" r="3.1" />
      <circle cx="14" cy="9.5" r="3.3" />
      <circle cx="20" cy="9.5" r="3.3" />
      <circle cx="24.5" cy="14" r="3.1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

function dayLabel(dateStr: string): string {
  const t = new Date().toISOString().slice(0, 10);
  if (dateStr === t) return "Today";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
