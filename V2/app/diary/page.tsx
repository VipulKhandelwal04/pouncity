"use client";

import { BrandLoader } from "@/components/BrandLoader";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PetAvatar } from "@/components/PetAvatar";
import { FeedingTap } from "@/components/FeedingTap";
import { HelpingWithList } from "@/components/HelpingWithList";
import {
  getAccount,
  getDiary,
  caregivingDiaries,
  diaryCaregiver,
  dietStatus,
  groomingStatus,
  completeness,
  feedingHistory,
  isNudgeDismissed,
  setNudgeDismissed,
  type Account,
  type Diary,
  type HubCardStatus,
} from "@/lib/diary-service";

export default function DiaryHome() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [helping, setHelping] = useState<Diary[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [caregiver, setCaregiver] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [nudgeHidden, setNudgeHidden] = useState(false);

  useEffect(() => {
    async function run() {
      // A person can be an owner AND a caregiver, so the home holds both:
      // "Your pet" (if they own one) and "Helping with". First paint gates
      // only on the (cached) account + diary; the caregiver line and the
      // "Helping with" list fill in after render rather than blocking it.
      const [acct, owned] = await Promise.all([getAccount(), getDiary()]);
      if (!acct) {
        // The hub is the installed app's start_url, so a signed-out open lands
        // on the landing page (which offers Sign in), not straight on sign-in.
        // Deep screens keep their /sign-in?next= redirects: those preserve
        // where a mid-flow visitor was headed.
        router.replace("/");
        return;
      }
      if (!acct.name) {
        router.replace("/diary/welcome"); // first sign-in → capture a display name
        return;
      }
      if (!owned) {
        const helpingNow = await caregivingDiaries();
        if (helpingNow.length === 0) {
          router.replace("/diary/create"); // no pet, not helping anyone → onboard an owner
          return;
        }
        setHelping(helpingNow);
      }
      setNudgeHidden(await isNudgeDismissed()); // localStorage — effectively instant
      setAccount(acct);
      setDiary(owned);
      setReady(true);
      if (owned) {
        void diaryCaregiver(owned.id).then(setCaregiver);
        void caregivingDiaries().then(setHelping);
      }
    }
    run();
  }, [router]);

  async function dismissNudge() {
    await setNudgeDismissed(true);
    setNudgeHidden(true);
  }

  if (!ready) {
    return <BrandLoader />;
  }

  return (
    <>
      <AppHeader account={account} />
      <main className="app-shell" style={{ paddingTop: 8 }}>
        {diary ? (
          // Owner: "who helps" + "pets you help with" both live on the Circle
          // (reached via the Circle card in the care group) — the hub no longer
          // duplicates the helping-with list.
          <OwnerHubBody
            diary={diary}
            account={account}
            caregiver={caregiver}
            nudgeHidden={nudgeHidden}
            onDismissNudge={dismissNudge}
            onDiaryChange={setDiary}
          />
        ) : (
          // Caregiver-only: the pets they help with ARE their home — keep the
          // list here (their home already is their circle-equivalent).
          <>
            <CaregiverOnlyIntro name={account?.name ?? null} />
            {helping.length > 0 && <HelpingWith diaries={helping} />}
            <CreateOwnPrompt />
          </>
        )}

        {/* join another pet with a shared code */}
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          <Link href="/diary/circle" className="mono" style={{ color: "var(--coral-text)" }}>
            Helping with a pet? Join with a code
          </Link>
        </div>
      </main>
    </>
  );
}

function OwnerHubBody({
  diary,
  account,
  caregiver,
  nudgeHidden,
  onDismissNudge,
  onDiaryChange,
}: {
  diary: Diary;
  account: Account | null;
  caregiver: Account | null;
  nudgeHidden: boolean;
  onDismissNudge: () => void;
  onDiaryChange: (d: Diary) => void;
}) {
  const comp = completeness(diary);
  const history = feedingHistory(diary);
  const circleStatus: HubCardStatus = caregiver
    ? { label: caregiver.name.split(" ")[0] || "Caregiver", tone: "ready" }
    : { label: "No one yet", tone: "empty" };
  const meta = [
    diary.breed,
    diary.ageLabel,
    diary.weightKg ? `${diary.weightKg} kg` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const desexed =
    diary.neuterStatus === "neutered" || diary.neuterStatus === "spayed";

  // Open a stored certificate. Chrome blocks navigating a tab to a data: URL, so
  // rehydrate it to a Blob URL first — works for both the image and PDF cases.
  function openCertificate(dataUrl: string) {
    try {
      const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
      const bin = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      /* malformed data URL — nothing to open */
    }
  }

  return (
    <>
        {/* pet header */}
        <section
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "12px 0 22px",
          }}
        >
          <PetAvatar species={diary.species} photoUrl={diary.photoUrl} name={diary.name} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "clamp(1.9rem, 8vw, 2.4rem)" }}>{diary.name}</h1>
            <p style={{ color: "var(--ink-72)", marginTop: 4, fontSize: "0.95rem" }}>
              {meta}
            </p>
            <Link
              href="/diary/edit"
              className="mono"
              style={{ display: "inline-block", marginTop: 8, color: "var(--coral-text)" }}
            >
              Edit diary
            </Link>
          </div>
        </section>

        {/* completeness nudge — non-blocking, dismissible */}
        {comp.missing.length > 0 && !nudgeHidden && (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 22,
              borderStyle: "dashed",
              paddingRight: 8,
            }}
          >
            <Link
              href="/diary/edit"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: 1,
                minWidth: 0,
              }}
            >
              <ProgressPips done={comp.done} total={comp.total} />
              <span style={{ minWidth: 0 }}>
                <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  Finish {diary.name}&rsquo;s diary
                </strong>
                <span
                  style={{
                    display: "block",
                    color: "var(--ink-72)",
                    fontSize: "0.88rem",
                    marginTop: 2,
                  }}
                >
                  Still to add: {comp.missing.join(", ")}
                </span>
              </span>
              <Chevron />
            </Link>
            <button
              type="button"
              onClick={onDismissNudge}
              aria-label="Dismiss, I've done enough"
              title="Dismiss"
              style={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                flex: "0 0 auto",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* feeding confirm — the headline (ticket 05) */}
        <FeedingTap
          diary={diary}
          by={account?.name || "you"}
          onChange={(d) => onDiaryChange(d)}
        />

        {/* personal feeding diary — its own section; opens the daily calendar */}
        <Link
          href="/diary/feeding"
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            marginBottom: 26,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              flex: "0 0 auto",
              borderRadius: 999,
              background: "var(--sun)",
              border: "var(--border)",
            }}
          >
            <CalendarIcon />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.08rem" }}>
              {diary.name}&rsquo;s Personal Feeding Diary
            </strong>
            <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem", marginTop: 2 }}>
              {history.length === 0
                ? "Open the calendar to start the daily record"
                : `${history.length} ${history.length === 1 ? "day" : "days"} logged · last fed ${dayLabel(
                    history[0].date
                  )}`}
            </span>
          </span>
          <Chevron />
        </Link>

        {/* care cards */}
        <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
          {diary.name}&rsquo;s care
        </h2>
        <div style={{ display: "grid", gap: 12, marginBottom: 26 }}>
          <CareCard
            href="/diary/diet"
            title="Diet plan"
            blurb="Diet & portion guidance"
            status={dietStatus(diary)}
          />
          <CareCard
            href="/diary/grooming"
            title="Grooming guide"
            blurb="Coat care & a reminder rhythm"
            status={groomingStatus(diary)}
          />
          <CareCard
            href="/diary/circle"
            title="Your Circle"
            blurb={`Who helps with ${diary.name}, and pets you help with`}
            status={circleStatus}
          />
        </div>

        {/* about — quirks + vet + records, shown once added (ticket 03) */}
        {(diary.quirks || diary.vet || desexed || diary.registered || diary.rabies) && (
          <>
            <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
              About {diary.name}
            </h2>
            <div className="card" style={{ display: "grid", gap: 14, marginBottom: 26 }}>
              {diary.quirks && (
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{diary.quirks}</p>
              )}
              {diary.vet && (
                <div
                  style={{
                    paddingTop: diary.quirks ? 14 : 0,
                    borderTop: diary.quirks ? "var(--border-thin)" : "none",
                  }}
                >
                  <span className="mono" style={{ display: "block", marginBottom: 4 }}>
                    Vet
                  </span>
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
              )}
              {(desexed || diary.registered || diary.rabies) && (
                <div
                  style={{
                    paddingTop: diary.quirks || diary.vet ? 14 : 0,
                    borderTop: diary.quirks || diary.vet ? "var(--border-thin)" : "none",
                  }}
                >
                  <span className="mono" style={{ display: "block", marginBottom: 8 }}>
                    Records
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {desexed && (
                      <Chip>{diary.neuterStatus === "neutered" ? "Neutered" : "Spayed"}</Chip>
                    )}
                    {diary.registered && <Chip>Registered</Chip>}
                    {diary.rabies && (
                      <Chip tone={rabiesExpired(diary.rabies.expiry) ? "warn" : "ok"}>
                        Rabies
                        {diary.rabies.expiry
                          ? ` · ${rabiesExpired(diary.rabies.expiry) ? "expired" : "until"} ${fmtDate(
                              diary.rabies.expiry
                            )}`
                          : ""}
                      </Chip>
                    )}
                  </div>
                  {diary.rabies?.certificateUrl && (
                    <button
                      type="button"
                      onClick={() => openCertificate(diary.rabies!.certificateUrl!)}
                      className="mono"
                      style={{
                        marginTop: 10,
                        padding: 0,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--coral-text)",
                      }}
                    >
                      View certificate
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
    </>
  );
}

/* ---- helping with + caregiver-only home (slice 05) --------------------- */

function HelpingWith({ diaries }: { diaries: Diary[] }) {
  return (
    <>
      <h2 className="mono" style={{ display: "block", marginBottom: 10 }}>
        Helping with
      </h2>
      <HelpingWithList diaries={diaries} />
    </>
  );
}

function CaregiverOnlyIntro({ name }: { name: string | null }) {
  return (
    <section style={{ margin: "12px 0 24px" }}>
      <h1 style={{ fontSize: "clamp(1.7rem, 7vw, 2.2rem)" }}>Hi{name ? `, ${name}` : ""}</h1>
      <p style={{ color: "var(--ink-72)", marginTop: 8, lineHeight: 1.55 }}>
        Here are the pets you help with. You don&rsquo;t have your own diary yet. Start
        one whenever you like.
      </p>
    </section>
  );
}

function CreateOwnPrompt() {
  return (
    <Link
      href="/diary/create"
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderStyle: "dashed",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: 44,
          height: 44,
          flex: "0 0 auto",
          borderRadius: 999,
          background: "var(--sun)",
          border: "var(--border)",
        }}
      >
        <PlusMark />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.05rem" }}>
          Create your own pet&rsquo;s diary
        </strong>
        <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem", marginTop: 2 }}>
          Start a diary for a pet you own: feeding, plans and sharing.
        </span>
      </span>
      <Chevron />
    </Link>
  );
}

function PlusMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---- small presentational pieces --------------------------------------- */

function CareCard({
  href,
  title,
  blurb,
  status,
}: {
  href: string;
  title: string;
  blurb: string;
  status: HubCardStatus;
}) {
  return (
    <Link
      href={href}
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.08rem" }}>
          {title}
        </strong>
        <span style={{ display: "block", color: "var(--ink-72)", fontSize: "0.85rem", marginTop: 2 }}>
          {blurb}
        </span>
      </span>
      <StatusChip status={status} />
      <Chevron />
    </Link>
  );
}

function StatusChip({ status }: { status: HubCardStatus }) {
  const empty = status.tone === "empty";
  return (
    <span
      className="mono"
      style={{
        whiteSpace: "nowrap",
        padding: "5px 10px",
        borderRadius: "var(--r-pill)",
        border: "var(--border-thin)",
        background: empty ? "transparent" : "var(--sun)",
        color: empty ? "var(--ink-72)" : "var(--ink)",
        fontSize: "0.6rem",
      }}
    >
      {status.label}
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="3" stroke="var(--ink)" strokeWidth="2.2" />
      <path d="M3 9h18" stroke="var(--ink)" strokeWidth="2.2" />
      <path d="M8 2.5v4M16 2.5v4" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="14.5" r="2" fill="var(--coral)" />
    </svg>
  );
}

function Chip({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" }) {
  const warn = tone === "warn";
  return (
    <span
      className="mono"
      style={{
        padding: "5px 10px",
        borderRadius: "var(--r-pill)",
        border: "var(--border-thin)",
        background: warn ? "var(--coral)" : "var(--sun)",
        color: "var(--ink)",
        fontSize: "0.6rem",
      }}
    >
      {children}
    </span>
  );
}

function ProgressPips({ done, total }: { done: number; total: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, flex: "0 0 auto" }} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            border: "2px solid var(--ink)",
            background: i < done ? "var(--coral)" : "transparent",
          }}
        />
      ))}
    </span>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <path d="M9 6l6 6-6 6" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="var(--ink-72)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function rabiesExpired(expiry: string | null): boolean {
  if (!expiry) return false;
  return expiry < new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
