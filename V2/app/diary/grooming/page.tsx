"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { Disclaimer } from "@/components/Disclaimer";
import {
  getDiary,
  requestGroomingGuide,
  saveGroomingGuide,
  getGroomReminder,
  setGroomReminder,
  type Diary,
} from "@/lib/diary-service";

type Step = "loading" | "intro" | "manual" | "capture" | "working" | "view" | "error";

export default function GroomingPage() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [coat, setCoat] = useState(""); // shared: AI capture + manual "coat type"
  const [remind, setRemind] = useState(false);

  // manual-entry fields
  const [mOverview, setMOverview] = useState("");
  const [mFreq, setMFreq] = useState("");
  const [mRoutine, setMRoutine] = useState("");
  const [mPro, setMPro] = useState("");
  const [mErr, setMErr] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const d = await getDiary();
      if (!d) {
        router.replace("/diary/create");
        return;
      }
      setDiary(d);
      setCoat(d.coatType ?? "");
      setRemind(await getGroomReminder());
      setStep(d.groomingGuide ? "view" : "intro");
    }
    run();
  }, [router]);

  useEffect(() => {
    if (step !== "working") return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const d = await requestGroomingGuide(coat);
      if (cancelled) return;
      if (!d) {
        setStep("error");
        return;
      }
      setDiary(d);
      setStep("view");
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, coat]);

  async function toggleRemind() {
    const v = !remind;
    setRemind(v);
    await setGroomReminder(v);
  }

  if (step === "loading" || !diary) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  const guide = diary.groomingGuide;
  const startAI = () => setStep(diary.coatType ? "working" : "capture");

  // Seed the manual form from the CURRENT guide at click-time (not stale mount state).
  function openManual() {
    const g = diary!.groomingGuide;
    setCoat(g?.coatType ?? diary!.coatType ?? "");
    setMOverview(g?.summary ?? "");
    setMFreq(g ? String(g.frequencyWeeks) : "");
    setMRoutine(g ? g.routine.join("\n") : "");
    setMPro(g?.professional ?? "");
    setMErr(null);
    setStep("manual");
  }

  async function saveManual() {
    const n = parseInt(mFreq, 10);
    if (!coat.trim() || !mFreq.trim() || isNaN(n) || n <= 0) {
      setMErr("Add the coat type and how often to groom (in weeks).");
      return;
    }
    const d = await saveGroomingGuide({
      coatType: coat,
      frequencyWeeks: n,
      routine: mRoutine.split("\n"),
      professional: mPro,
      summary: mOverview,
    });
    if (!d) {
      setStep("error");
      return;
    }
    setDiary(d);
    setStep("view");
  }

  return (
    <DetailShell title="Grooming guide">
      {step === "intro" && (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            A home-care rhythm for {diary.name}, plus when a professional groom actually helps.
            Write it in yourself, or let Pouncity draft one from breed and coat.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={openManual}>
              Enter {diary.name}&rsquo;s guide
            </button>
            <button className="pill pill--ghost" onClick={startAI}>
              Or generate with AI
            </button>
          </div>
          <Disclaimer petName={diary.name} />
        </div>
      )}

      {step === "manual" && (
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Overview (optional)">
            <textarea
              className="input"
              rows={2}
              value={mOverview}
              onChange={(e) => setMOverview(e.target.value)}
              placeholder={`A line about ${diary.name}'s grooming, e.g. Brush often, bath monthly.`}
              autoFocus
            />
          </Field>
          <Field label="Coat type">
            <input
              className="input"
              value={coat}
              onChange={(e) => {
                setCoat(e.target.value);
                setMErr(null);
              }}
              placeholder="e.g. long double coat, short & smooth, curly"
            />
          </Field>
          <Field label="Groom every… (weeks)">
            <input
              className="input"
              value={mFreq}
              onChange={(e) => {
                setMFreq(e.target.value);
                setMErr(null);
              }}
              placeholder="e.g. 6"
              inputMode="numeric"
            />
          </Field>
          <Field label="At-home routine (optional, one per line)">
            <textarea
              className="input"
              rows={3}
              value={mRoutine}
              onChange={(e) => setMRoutine(e.target.value)}
              placeholder={"Brush every day or two\nBath every 4–6 weeks\nTrim nails every 3–4 weeks"}
            />
          </Field>
          <Field label="Professional grooming (optional)">
            <textarea
              className="input"
              rows={2}
              value={mPro}
              onChange={(e) => setMPro(e.target.value)}
              placeholder="e.g. A professional groom every 6 weeks keeps the coat and nails in shape."
            />
          </Field>
          {mErr && (
            <p className="field-msg" role="alert">
              {mErr}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={saveManual}>
              Save guide
            </button>
            <button className="pill pill--ghost" onClick={() => setStep(guide ? "view" : "intro")}>
              Cancel
            </button>
          </div>
          <Disclaimer petName={diary.name} />
        </div>
      )}

      {step === "capture" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-field" style={{ margin: 0 }}>
            <label>What&rsquo;s {diary.name}&rsquo;s coat like?</label>
            <input
              className="input"
              value={coat}
              onChange={(e) => setCoat(e.target.value)}
              placeholder="e.g. long double coat, short & smooth, curly"
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={() => setStep("working")}>
              Generate guide
            </button>
            <button
              className="pill pill--ghost"
              onClick={() => {
                setCoat("");
                setStep("working");
              }}
            >
              I&rsquo;m not sure
            </button>
          </div>
          <Disclaimer petName={diary.name} />
        </div>
      )}

      {step === "working" && (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: "var(--ink-72)" }}>
            Building {diary.name}&rsquo;s guide…
          </p>
        </div>
      )}

      {step === "error" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ borderStyle: "dashed" }}>
            <p>That didn&rsquo;t save. It&rsquo;s not you. Head back and give it another go.</p>
          </div>
          <button className="pill" onClick={() => setStep("intro")} style={{ justifySelf: "start" }}>
            Back
          </button>
        </div>
      )}

      {step === "view" && guide && (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ fontSize: "1.08rem", lineHeight: 1.5 }}>{guide.summary}</p>

          <div style={{ display: "grid", gap: 10 }}>
            <StatRow label="Coat" value={guide.coatType} />
            <StatRow label="Groomer" value={`Every ${guide.frequencyWeeks} weeks`} />
          </div>

          {guide.routine.length > 0 && (
            <div>
              <span className="mono" style={{ display: "block", marginBottom: 10 }}>
                At home
              </span>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {guide.routine.map((t, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ flex: "0 0 auto", marginTop: 2 }}>
                      <TipPaw />
                    </span>
                    <span style={{ lineHeight: 1.5 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <span className="mono" style={{ display: "block", marginBottom: 6 }}>
              Professional grooming
            </span>
            <p style={{ lineHeight: 1.5 }}>{guide.professional}</p>
          </div>

          {/* recurring reminder opt-in (delivery is ticket 09) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              border: "var(--border-thin)",
              borderRadius: 14,
              background: "var(--panel)",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>Remind me every {guide.frequencyWeeks} weeks</span>
            <button
              type="button"
              role="switch"
              aria-checked={remind}
              aria-label={`Remind me to groom ${diary.name} every ${guide.frequencyWeeks} weeks`}
              className="switch"
              onClick={toggleRemind}
            >
              <span className="knob" />
            </button>
          </div>

          <Disclaimer petName={diary.name} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="pill pill--ghost" onClick={openManual}>
                Edit
              </button>
              <button className="pill pill--ghost" onClick={() => setStep("capture")}>
                Regenerate
              </button>
            </div>
            <span className="mono" style={{ color: "var(--ink-72)" }}>
              Saved {new Date(guide.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </DetailShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field" style={{ margin: 0 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        padding: "12px 14px",
        border: "var(--border-thin)",
        borderRadius: 14,
        background: "var(--panel)",
      }}
    >
      <span className="mono" style={{ flex: "0 0 auto" }}>
        {label}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function TipPaw() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="var(--coral)" aria-hidden="true">
      <ellipse cx="16" cy="21" rx="7.5" ry="6" />
      <circle cx="8.5" cy="13" r="3.1" />
      <circle cx="14" cy="9.5" r="3.3" />
      <circle cx="20" cy="9.5" r="3.3" />
      <circle cx="24.5" cy="14" r="3.1" />
    </svg>
  );
}
