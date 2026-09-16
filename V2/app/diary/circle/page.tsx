"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DetailShell } from "@/components/DetailShell";
import { HelperRow } from "@/components/HelperRow";
import { HelpingWithList } from "@/components/HelpingWithList";
import {
  getAccount,
  getDiary,
  diaryCaregiver,
  pastCaregivers,
  getRating,
  setRating,
  caregivingDiaries,
  regenerateHandoverLink,
  revokeHandoverLink,
  handoverReadiness,
  handoverCode,
  resolveCode,
  resolveHandoverGate,
  roleOnDiary,
  joinAsCaregiver,
  type Account,
  type Diary,
  type Rating,
} from "@/lib/diary-service";
import { track } from "@/lib/analytics";

/**
 * The Circle — the Owner's one place to manage who cares for their pet and to
 * see the pets they help with (CONTEXT.md: Circle). A pet has ONE caregiver at a
 * time (ADR-0007); the many "helped before" are its past caregivers. It is also
 * the handover surface: create / share / end the Handover link happen here. No
 * discovery / stranger surface, ever — access is only earned by a link or code
 * (ADR-0005).
 */
export default function CirclePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [caregiver, setCaregiver] = useState<Account | null>(null);
  const [pastHelpers, setPastHelpers] = useState<{ account: Account; endedAt: string }[]>([]);
  const [helping, setHelping] = useState<Diary[]>([]);
  const [ready, setReady] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState<"link" | "code" | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [gateMissing, setGateMissing] = useState<
    { label: string; where: "edit" | "diet" }[] | null
  >(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinedName, setJoinedName] = useState<string | null>(null);
  // Ratings keyed by caregiverAccountId — getRating() is async now, so it can't be
  // called inline during render (it was, in the mock/sync version); fetched here
  // for every account id currently rendered (the current caregiver + past helpers)
  // and updated locally by rate() rather than re-fetched on every change.
  const [ratings, setRatings] = useState<Record<string, Rating | null>>({});

  useEffect(() => {
    async function run() {
      const acct = await getAccount();
      if (!acct) {
        router.replace("/sign-in?next=" + encodeURIComponent("/diary/circle"));
        return;
      }
      if (!acct.name) {
        router.replace("/diary/welcome");
        return;
      }
      const owned = await getDiary();
      // A signed-in account can always reach the Circle — it is also where you enter
      // a code to help with someone's pet, so a 0-caregiving account is not bounced.
      const cg = owned ? await diaryCaregiver(owned.id) : null;
      const past = owned ? await pastCaregivers(owned.id) : [];
      setAccount(acct);
      setDiary(owned);
      setCaregiver(cg);
      setPastHelpers(past);
      setHelping(await caregivingDiaries());
      setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");

      if (owned) {
        const ids = [cg?.id, ...past.map((p) => p.account.id)].filter(
          (id): id is string => !!id
        );
        const entries = await Promise.all(
          ids.map(async (id) => [id, await getRating(id, owned.id)] as const)
        );
        setRatings(Object.fromEntries(entries));
      }

      setReady(true);
    }
    run();
  }, [router]);

  if (!ready) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  const token = diary?.handover.token ?? null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = token ? `${origin}/d/${token}` : "";
  const code = handoverCode(token);

  // Health gate (ticket 06): a link cannot be created/regenerated until the pet's
  // safety basics are present. Fires ONLY here, at handover creation.
  async function createLink() {
    if (!diary) return;
    const readiness = handoverReadiness(diary);
    if (!readiness.ready) {
      setGateMissing(readiness.missing);
      return;
    }
    setGateMissing(null);
    const d = await regenerateHandoverLink();
    if (d) {
      setDiary(d);
      void track("handover_created", { diaryId: d.id });
    }
  }
  async function replaceLink() {
    if (!diary) return;
    const readiness = handoverReadiness(diary);
    if (!readiness.ready) {
      setGateMissing(readiness.missing);
      return;
    }
    setGateMissing(null);
    const d = await regenerateHandoverLink();
    if (d) {
      setDiary(d);
      setCopiedWhat(null);
      void track("handover_created", { diaryId: d.id });
    }
  }
  // Ends the pet's care: kills the link AND unbinds the one caregiver, who becomes
  // a Past Caregiver (ADR-0006). Also cancels an unclaimed invite (no caregiver).
  async function endCare() {
    const d = await revokeHandoverLink();
    if (d) {
      setDiary(d);
      setCaregiver(await diaryCaregiver(d.id)); // → null
      const past = await pastCaregivers(d.id); // the ended caregiver joins past helpers
      setPastHelpers(past);
      const ids = past.map((p) => p.account.id);
      const entries = await Promise.all(
        ids.map(async (id) => [id, await getRating(id, d.id)] as const)
      );
      setRatings((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      setConfirmingEnd(false);
      setCopiedWhat(null);
    }
  }
  async function copyText(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhat(which);
      setTimeout(() => setCopiedWhat(null), 1800);
    } catch {
      /* clipboard blocked — the value is still selectable in its field */
    }
  }
  async function share() {
    try {
      await navigator.share({ title: `${diary!.name}'s diary`, url: link });
    } catch {
      /* cancelled or unsupported */
    }
  }
  async function joinByCode(e: React.FormEvent) {
    e.preventDefault();
    setJoinedName(null);
    const resolved = await resolveCode(joinCode);
    if (!resolved) {
      setJoinError("We couldn't find a pet for that code. Check it and try again.");
      return;
    }
    const target = await resolveHandoverGate(resolved);
    if (!target) {
      setJoinError("That code isn't active anymore. Ask the owner for a fresh one.");
      return;
    }
    const myRole = await roleOnDiary(target.diaryId);
    if (myRole === "owner") {
      setJoinError(`That's your own pet's code. ${target.petName} is already yours.`);
      return;
    }
    // 1:1 (ADR-0007): the spot is taken if the pet already has a caregiver and it
    // isn't me. `taken` is server-computed (/api/handover) because I can't read
    // the caregiver membership myself under RLS; my own "already helping" case is
    // covered by myRole above.
    if (myRole !== "caregiver" && target.taken) {
      setJoinError(`${target.petName} already has a caregiver right now.`);
      return;
    }
    const membership = await joinAsCaregiver(resolved);
    if (!membership) {
      setJoinError("That code isn't active anymore. Ask the owner for a fresh one.");
      return;
    }
    setHelping(await caregivingDiaries()); // the newly-joined pet now appears below
    setJoinCode("");
    setJoinError(null);
    setJoinedName(target?.petName ?? "the pet");
  }
  async function rate(caregiverAccountId: string, stars: number, note: string) {
    if (!diary) return;
    const updated = await setRating(caregiverAccountId, diary.id, stars, note);
    setRatings((prev) => ({ ...prev, [caregiverAccountId]: updated }));
  }
  const starsFor = (accountId: string) => ratings[accountId]?.stars ?? 0;
  // Past helpers are ordered by the Owner's own Ratings — most trusted first.
  const sortedPast = [...pastHelpers].sort((a, b) => {
    const byStars = starsFor(b.account.id) - starsFor(a.account.id);
    return byStars !== 0 ? byStars : b.endedAt.localeCompare(a.endedAt);
  });

  return (
    <DetailShell title="Your Circle">
      <div style={{ display: "grid", gap: 26 }}>
        <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
          {diary
            ? `Who's caring for ${diary.name}, and the pets you help with, all in one place.`
            : "The pets you help with, all in one place."}
        </p>

        {/* Owner: the pet's ONE current caregiver (ADR-0007) + end-care. */}
        {diary && (
          <section style={{ display: "grid", gap: 10 }}>
            <h2 className="mono">{diary.name}&rsquo;s caregiver</h2>
            <div className="card">
              {caregiver ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    <HelperRow
                      account={caregiver}
                      sublabel="Caregiver"
                      variant="current"
                      rating={ratings[caregiver.id] ?? null}
                      onRate={(stars, note) => rate(caregiver.id, stars, note)}
                    />
                  </ul>
                  <div style={{ paddingTop: 14, borderTop: "var(--border-thin)" }}>
                    {!confirmingEnd ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingEnd(true)}
                        className="tap-target"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          color: "var(--coral-text)",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                        }}
                      >
                        End {caregiver.name}&rsquo;s care
                      </button>
                    ) : (
                      <div
                        className="card"
                        style={{ borderColor: "var(--coral-text)", display: "grid", gap: 14 }}
                      >
                        <div>
                          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                            End {caregiver.name}&rsquo;s care?
                          </strong>
                          <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", marginTop: 4, lineHeight: 1.5 }}>
                            They lose access to {diary.name} right away. You&rsquo;ll keep them in{" "}
                            {diary.name}&rsquo;s history, with your rating, and can invite someone
                            new afterward.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button type="button" onClick={endCare} className="pill" style={{ background: "var(--coral)" }}>
                            Yes, end care
                          </button>
                          <button type="button" onClick={() => setConfirmingEnd(false)} className="pill pill--ghost">
                            Keep them
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--ink-72)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                  No one is caring for {diary.name} right now.
                  {token ? " Your invite is waiting below." : " Invite a sitter below."}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Owner: who helped before — retained on end-care (ADR-0006), history only. */}
        {diary && pastHelpers.length > 0 && (
          <section style={{ display: "grid", gap: 10 }}>
            <h2 className="mono">Helped with {diary.name} before</h2>
            <div className="card">
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18 }}>
                {sortedPast.map(({ account: past, endedAt }) => (
                  <HelperRow
                    key={past.id}
                    account={past}
                    sublabel={`Access ended ${fmtEndedDate(endedAt)}`}
                    variant="past"
                    rating={ratings[past.id] ?? null}
                    onRate={(stars, note) => rate(past.id, stars, note)}
                  />
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Owner: invite a sitter — ONLY when the single spot is open (ADR-0007). */}
        {diary && !caregiver && (
          <section style={{ display: "grid", gap: 10 }}>
            <h2 className="mono">Invite a sitter</h2>
            {gateMissing && (
              <div
                className="card"
                style={{ borderColor: "var(--coral-text)", display: "grid", gap: 12 }}
              >
                <div>
                  <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    Before you share {diary.name}
                  </strong>
                  <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", marginTop: 4, lineHeight: 1.5 }}>
                    A sitter needs {diary.name}&rsquo;s care basics first. Add:{" "}
                    {gateMissing.map((m) => m.label).join(", ")}.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {gateMissing.some((m) => m.where === "edit") && (
                    <Link href="/diary/edit" className="pill pill--sm">
                      Complete {diary.name}&rsquo;s details
                    </Link>
                  )}
                  {gateMissing.some((m) => m.where === "diet") && (
                    <Link href="/diary/diet" className="pill pill--sm">
                      Set up {diary.name}&rsquo;s diet plan
                    </Link>
                  )}
                  <button
                    type="button"
                    className="pill pill--ghost pill--sm"
                    onClick={() => setGateMissing(null)}
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}
            {!token ? (
              <div className="card" style={{ display: "grid", gap: 16 }}>
                <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
                  Make one link and hand it to a sitter. They sign in with a quick account,
                  so you know who&rsquo;s caring for {diary.name}, then see the routine and vet
                  and log the daily feed. Set it up once, before you ever need it.
                </p>
                <button className="pill" onClick={createLink} style={{ justifySelf: "start" }}>
                  Create a handover link
                </button>
              </div>
            ) : (
              <div className="card" style={{ display: "grid", gap: 22 }}>
                {/* the link */}
                <div style={{ display: "grid", gap: 10 }}>
                  <span className="mono">{diary.name}&rsquo;s handover link</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "var(--border)",
                      borderRadius: 14,
                      background: "var(--cream)",
                      padding: "10px 12px",
                    }}
                  >
                    <input
                      readOnly
                      value={link}
                      onFocus={(e) => e.currentTarget.select()}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        background: "transparent",
                        font: "inherit",
                        fontSize: "0.9rem",
                        color: "var(--ink)",
                      }}
                      aria-label="Handover link"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="pill pill--sm" onClick={() => copyText(link, "link")}>
                      {copiedWhat === "link" ? "Copied" : "Copy link"}
                    </button>
                    {canShare && (
                      <button className="pill pill--ghost pill--sm" onClick={share}>
                        Share…
                      </button>
                    )}
                  </div>
                  <span className="hint">
                    Waiting for a sitter to join. The first person to use it becomes {diary.name}
                    &rsquo;s caregiver.
                  </span>
                </div>

                {/* referral code — the same link, read out loud */}
                <div style={{ display: "grid", gap: 10 }}>
                  <span className="mono">Or read out a code</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      border: "var(--border)",
                      borderRadius: 14,
                      background: "var(--sun)",
                      padding: "12px 14px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "1.15rem",
                        letterSpacing: "0.12em",
                        color: "var(--ink)",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {code}
                    </span>
                    <button
                      className="pill pill--ghost pill--sm"
                      onClick={() => copyText(code, "code")}
                      style={{ flex: "0 0 auto" }}
                    >
                      {copiedWhat === "code" ? "Copied" : "Copy code"}
                    </button>
                  </div>
                  <span className="hint">
                    Same as the link. A sitter can enter this code instead.
                  </span>
                </div>

                {/* manage — replace / cancel the unclaimed invite */}
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    paddingTop: 18,
                    borderTop: "var(--border-thin)",
                  }}
                >
                  <button className="pill pill--ghost" onClick={replaceLink} style={{ justifySelf: "start" }}>
                    Replace with a new link
                  </button>
                  <span className="hint" style={{ marginTop: -4 }}>
                    Makes a fresh link and turns the current one off.
                  </span>

                  {!confirmingEnd ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingEnd(true)}
                      className="tap-target"
                      style={{
                        justifySelf: "start",
                        marginTop: 8,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--coral-text)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                      }}
                    >
                      Cancel this invite
                    </button>
                  ) : (
                    <div
                      className="card"
                      style={{ marginTop: 8, borderColor: "var(--coral-text)", display: "grid", gap: 14 }}
                    >
                      <div>
                        <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                          Cancel this invite?
                        </strong>
                        <p style={{ color: "var(--ink-72)", fontSize: "0.9rem", marginTop: 4 }}>
                          The link and code stop working. No one is helping yet, so nothing is
                          lost. You can make a new one anytime.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" onClick={endCare} className="pill" style={{ background: "var(--coral)" }}>
                          Yes, cancel
                        </button>
                        <button type="button" onClick={() => setConfirmingEnd(false)} className="pill pill--ghost">
                          Keep it live
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Caregiver side: join a pet with a code, then the pets I help with. */}
        <section style={{ display: "grid", gap: 10 }}>
          <h2 className="mono">Helping with someone&rsquo;s pet?</h2>
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <p style={{ color: "var(--ink-72)", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Enter the code an owner read out to you to start helping with their pet.
            </p>
            <form onSubmit={joinByCode} noValidate style={{ display: "grid", gap: 10 }}>
              <label htmlFor="circle-code" className="mono">
                Care code
              </label>
              <input
                id="circle-code"
                className="input"
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  if (joinError) setJoinError(null);
                  if (joinedName) setJoinedName(null);
                }}
                placeholder="e.g. A1B2-C3D4"
                aria-invalid={!!joinError}
                aria-describedby={joinError ? "circle-code-error" : undefined}
                style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
              />
              {joinError && (
                <div id="circle-code-error" className="field-msg" role="alert">
                  {joinError}
                </div>
              )}
              {joinedName && (
                <div className="mono" role="status" style={{ color: "var(--coral-text)" }}>
                  You&rsquo;re now helping with {joinedName}.
                </div>
              )}
              <button type="submit" className="pill" style={{ justifySelf: "start" }}>
                Add pet
              </button>
            </form>
          </div>
        </section>

        {helping.length > 0 && (
          <section style={{ display: "grid", gap: 10 }}>
            <h2 className="mono">Pets you help with</h2>
            <HelpingWithList diaries={helping} />
          </section>
        )}
      </div>
    </DetailShell>
  );
}

function fmtEndedDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
