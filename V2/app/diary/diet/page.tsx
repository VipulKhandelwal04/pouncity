"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailShell } from "@/components/DetailShell";
import { Disclaimer } from "@/components/Disclaimer";
import { getDiary, requestDietPlan, saveDietPlan, type Diary } from "@/lib/diary-service";

type Step = "loading" | "intro" | "manual" | "capture" | "working" | "view" | "error";

export default function DietPage() {
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [food, setFood] = useState(""); // shared: AI capture + manual "current food"

  // manual-entry fields
  const [mOverview, setMOverview] = useState("");
  const [mPortion, setMPortion] = useState("");
  const [mMeals, setMMeals] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [mErr, setMErr] = useState<string | null>(null);

  useEffect(() => {
    const d = getDiary();
    if (!d) {
      router.replace("/diary/create");
      return;
    }
    setDiary(d);
    setFood(d.currentFood ?? "");
    setStep(d.dietPlan ? "view" : "intro");
  }, [router]);

  // AI "generation" runs on entering the working step (canned; AI Gateway later)
  useEffect(() => {
    if (step !== "working") return;
    const t = setTimeout(() => {
      const d = requestDietPlan(food);
      if (!d) {
        setStep("error");
        return;
      }
      setDiary(d);
      setStep("view");
    }, 1200);
    return () => clearTimeout(t);
  }, [step, food]);

  if (step === "loading" || !diary) {
    return (
      <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="mono">Loading…</span>
      </main>
    );
  }

  const plan = diary.dietPlan;
  const startAI = () => setStep(diary.currentFood ? "working" : "capture");

  // Seed the manual form from the CURRENT plan at click-time (never from stale
  // mount state — an AI plan generated after mount must show its real values).
  function openManual() {
    const p = diary!.dietPlan;
    setFood(p?.currentFood ?? diary!.currentFood ?? "");
    setMOverview(p?.summary ?? "");
    setMPortion(p?.portionPerDay ?? "");
    setMMeals(p?.meals ?? "");
    setMNotes(p ? p.tips.join("\n") : "");
    setMErr(null);
    setStep("manual");
  }

  function saveManual() {
    if (!mPortion.trim() || !mMeals.trim()) {
      setMErr("Add at least the amount per day and the meals.");
      return;
    }
    const d = saveDietPlan({
      currentFood: food,
      portionPerDay: mPortion,
      meals: mMeals,
      summary: mOverview,
      tips: mNotes.split("\n"),
    });
    if (!d) {
      setStep("error");
      return;
    }
    setDiary(d);
    setStep("view");
  }

  return (
    <DetailShell title="Diet plan">
      {step === "intro" && (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ color: "var(--ink-72)", lineHeight: 1.55 }}>
            A simple daily feeding guide for {diary.name} — what to feed and how much. Write it
            in yourself, or let Pouncity draft one from breed, age and weight.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={openManual}>
              Enter {diary.name}&rsquo;s plan
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
              placeholder={`A line about ${diary.name}'s feeding — e.g. Measured by weight, twice a day.`}
              autoFocus
            />
          </Field>
          <Field label="Current food">
            <input
              className="input"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              placeholder="e.g. Acme Adult Chicken (dry)"
            />
          </Field>
          <Field label="Amount per day">
            <input
              className="input"
              value={mPortion}
              onChange={(e) => {
                setMPortion(e.target.value);
                setMErr(null);
              }}
              placeholder="e.g. About 240 g of dry food a day"
            />
          </Field>
          <Field label="Meals">
            <input
              className="input"
              value={mMeals}
              onChange={(e) => {
                setMMeals(e.target.value);
                setMErr(null);
              }}
              placeholder="e.g. 2 meals — morning and evening"
            />
          </Field>
          <Field label="Notes (optional, one per line)">
            <textarea
              className="input"
              rows={3}
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              placeholder={"Weigh portions with a scale\nKeep treats under 10% of the day's food"}
            />
          </Field>
          {mErr && (
            <p className="field-msg" role="alert">
              {mErr}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={saveManual}>
              Save plan
            </button>
            <button className="pill pill--ghost" onClick={() => setStep(plan ? "view" : "intro")}>
              Cancel
            </button>
          </div>
          <Disclaimer petName={diary.name} />
        </div>
      )}

      {step === "capture" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-field" style={{ margin: 0 }}>
            <label>What are you feeding {diary.name} right now?</label>
            <input
              className="input"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              placeholder="e.g. Acme Adult Chicken (dry)"
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pill" onClick={() => setStep("working")}>
              Generate plan
            </button>
            <button
              className="pill pill--ghost"
              onClick={() => {
                setFood("");
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
            Building {diary.name}&rsquo;s plan…
          </p>
        </div>
      )}

      {step === "error" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ borderStyle: "dashed" }}>
            <p>That didn&rsquo;t save. It&rsquo;s not you — head back and give it another go.</p>
          </div>
          <button
            className="pill"
            onClick={() => setStep("intro")}
            style={{ justifySelf: "start" }}
          >
            Back
          </button>
        </div>
      )}

      {step === "view" && plan && (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ fontSize: "1.08rem", lineHeight: 1.5 }}>{plan.summary}</p>

          <div style={{ display: "grid", gap: 10 }}>
            <StatRow label="Each day" value={plan.portionPerDay} />
            <StatRow label="Meals" value={plan.meals} />
            <StatRow label="Current food" value={plan.currentFood} />
          </div>

          {plan.tips.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {plan.tips.map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ flex: "0 0 auto", marginTop: 2 }}>
                    <TipPaw />
                  </span>
                  <span style={{ lineHeight: 1.5 }}>{t}</span>
                </li>
              ))}
            </ul>
          )}

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
              Saved {new Date(plan.createdAt).toLocaleDateString()}
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
